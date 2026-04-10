import { useEffect, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  Heart,
  MapPin,
  MessageSquare,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  ThumbsUp,
  TrendingUp,
  Trash2,
  Users,
} from "lucide-react"
import { GetAllBookings } from "@/api/booking"
import { GetRatingsList, GetTripsList, GetLatestSummary, GenerateSummary, DeleteRating } from "@/api/trip"
import type { Rating, AISummary } from "@/api/trip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import "./summary-theme.css"

type TripSortOption =
  | "latest-review"
  | "rating-desc"
  | "reviewers-desc"
  | "travelers-desc"

interface EnrichedTrip {
  id: string
  name: string
  destination: string
  image: string
  tripDateLabel: string
  serviceRating: number
  reviewsCount: number
  reviewersCount: number
  totalTripTravelers: number
  category: string
  categoryLabel: string
  reviews: Rating[]
  lastReviewAt: string | null
}

const DEFAULT_TRIP_IMAGE =
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a"

const TRIP_LIST_PREVIEW_LIMIT = 8

const TRIP_SORT_OPTIONS: { value: TripSortOption; label: string }[] = [
  { value: "reviewers-desc", label: "คนให้คะแนนมากสุดก่อน" },
  { value: "travelers-desc", label: "ผู้เดินทางมากสุดก่อน" },
  { value: "rating-desc", label: "คะแนนบริการมากไปน้อย" },
  { value: "latest-review", label: "รีวิวล่าสุดก่อน" },
]

function createInitialRatingsStats() {
  return [
    { stars: 5, count: 0, percentage: 0 },
    { stars: 4, count: 0, percentage: 0 },
    { stars: 3, count: 0, percentage: 0 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
  ]
}

function formatThaiDate(
  value: string | null,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  }
) {
  if (!value) return "-"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleDateString("th-TH", options)
}

/** คำแนะนำเป็นสตริงแยกรายข้อ — ใช้ suggestion_bullets จาก API ถ้ามี ไม่เช่นนั้นแยกจาก suggestion เดิม */
function suggestionItemsFromSummary(summary: AISummary): string[] {
  const bullets = summary.suggestion_bullets?.map((s) => s.trim()).filter(Boolean)
  if (bullets && bullets.length > 0) return bullets

  const raw = (summary.suggestion || "").trim()
  if (!raw) return []

  const lines = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  const out: string[] = []
  for (const line of lines) {
    const numbered = line.match(/^\d+\.\s*(.+)$/u)
    if (numbered) {
      out.push(numbered[1].replace(/^[-•–\u2022]\s*/, "").trim())
      continue
    }
    out.push(line.replace(/^[-•–\u2022]\s*/, "").trim())
  }
  return out.filter(Boolean)
}

function formatThaiDateTime(value: string | null) {
  if (!value) return "-"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getReviewAuthor(review: Rating) {
  return review.user_name || `User ${String(review.user).slice(0, 6)}`
}

/** Ratings from the API may be strings or missing; keep UI from showing NaN. */
function formatReviewScore(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return "—"
  return n.toFixed(1)
}

function EmptyReviewsState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export default function AIInsightDashboard() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [trips, setTrips] = useState<EnrichedTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingsStats, setRatingsStats] = useState(createInitialRatingsStats)
  const [totalReviews, setTotalReviews] = useState(0)
  const [averageRating, setAverageRating] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState<TripSortOption>("reviewers-desc")
  const [tripListExpanded, setTripListExpanded] = useState(false)
  const [ratingDeltaMonth, setRatingDeltaMonth] = useState(0)
  const [summary, setSummary] = useState<AISummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<{ reviewId: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDeleteReview() {
    if (!deleteTarget || isDeleting) return
    setIsDeleting(true)
    try {
      const success = await DeleteRating(deleteTarget.reviewId)
      if (success) {
        setTrips((prev) =>
          prev
            .map((trip) => ({
              ...trip,
              reviews: trip.reviews.filter((r) => r.id !== deleteTarget.reviewId),
              reviewsCount: trip.reviews.filter((r) => r.id !== deleteTarget.reviewId).length,
              reviewersCount: new Set(
                trip.reviews
                  .filter((r) => r.id !== deleteTarget.reviewId)
                  .map((r) => String(r.user))
              ).size,
            }))
            .filter((trip) => trip.reviews.length > 0)
        )
        setTotalReviews((prev) => prev - 1)
      }
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  async function handleGenerate() {
    if (isUpdating) return
    setIsUpdating(true)
    try {
      const result = await GenerateSummary()
      if (result) setSummary(result)
    } finally {
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    GetLatestSummary().then((data) => {
      if (data) setSummary(data)
    }).finally(() => setSummaryLoading(false))
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const [tripsData, ratingsData, bookingsData] = await Promise.all([
          GetTripsList(),
          GetRatingsList(),
          GetAllBookings(),
        ])

        const travelersByTrip = new Map<string, number>()
        for (const b of bookingsData) {
          if (b.status === "cancelled") continue
          const tid = String(b.trip)
          travelersByTrip.set(
            tid,
            (travelersByTrip.get(tid) ?? 0) + (b.group_size || 0),
          )
        }

        const total = ratingsData.length
        setTotalReviews(total)

        if (total > 0) {
          const sum = ratingsData.reduce(
            (acc, rating) => acc + (rating.trip_rating || 0),
            0
          )
          const overallAverage = sum / total
          setAverageRating(overallAverage)

          const now = new Date()
          const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          const previousMonthStart = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
          )
          const previousMonthEnd = new Date(
            now.getFullYear(),
            now.getMonth(),
            0,
            23,
            59,
            59,
            999
          )

          const currentMonthRatings = ratingsData.filter((rating) => {
            const createdAt = new Date(rating.created_at)
            return createdAt >= currentMonthStart
          })

          const previousMonthRatings = ratingsData.filter((rating) => {
            const createdAt = new Date(rating.created_at)
            return createdAt >= previousMonthStart && createdAt <= previousMonthEnd
          })

          if (currentMonthRatings.length > 0 && previousMonthRatings.length > 0) {
            const currentAvg =
              currentMonthRatings.reduce(
                (acc, rating) => acc + (rating.trip_rating || 0),
                0
              ) / currentMonthRatings.length

            const previousAvg =
              previousMonthRatings.reduce(
                (acc, rating) => acc + (rating.trip_rating || 0),
                0
              ) / previousMonthRatings.length

            setRatingDeltaMonth(currentAvg - previousAvg)
          } else {
            setRatingDeltaMonth(0)
          }

          const counts = [0, 0, 0, 0, 0, 0]
          ratingsData.forEach((rating) => {
            const stars = Math.round(rating.trip_rating || 0)
            if (stars >= 1 && stars <= 5) counts[stars] += 1
          })

          setRatingsStats(
            [5, 4, 3, 2, 1].map((stars) => ({
              stars,
              count: counts[stars],
              percentage: Math.round((counts[stars] / total) * 100),
            }))
          )
        } else {
          setAverageRating(0)
          setRatingsStats(createInitialRatingsStats())
        }

        const ratingsByTrip = new Map<string, Rating[]>()
        ratingsData.forEach((rating) => {
          const tripId = String(rating.trip)
          const existingRatings = ratingsByTrip.get(tripId)

          if (existingRatings) {
            existingRatings.push(rating)
            return
          }

          ratingsByTrip.set(tripId, [rating])
        })

        const processedTrips = tripsData
          .map((trip) => {
            const tripRatings = [...(ratingsByTrip.get(String(trip.id)) || [])].sort(
              (a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )

            if (tripRatings.length === 0) {
              return null
            }

            const reviewersCount = new Set(
              tripRatings.map((rating) => String(rating.user))
            ).size

            const totalServiceRating = tripRatings.reduce(
              (acc, rating) => acc + (Number(rating.service_rating) || 0),
              0
            )

            const tripId = String(trip.id)
            return {
              id: tripId,
              name: trip.name || "Unknown Trip",
              destination:
                trip.province || trip.location || trip.country || "Unknown",
              image: trip.thumbnail_image || DEFAULT_TRIP_IMAGE,
              tripDateLabel: formatThaiDate(trip.start_date),
              serviceRating: totalServiceRating / tripRatings.length,
              reviewsCount: tripRatings.length,
              reviewersCount,
              totalTripTravelers: travelersByTrip.get(tripId) ?? 0,
              category: trip.category || "other",
              categoryLabel: trip.category_label || trip.category || "ทั่วไป",
              reviews: tripRatings,
              lastReviewAt: tripRatings[0]?.created_at || null,
            } satisfies EnrichedTrip
          })
          .filter((trip): trip is EnrichedTrip => trip !== null)

        setTrips(processedTrips)
      } catch (error) {
        console.error("Failed to fetch data", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const categoryOptions = Array.from(
    new Map(trips.map((trip) => [trip.category, trip.categoryLabel])).entries()
  )
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "th"))

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  const filteredTrips = trips.filter((trip) => {
    const matchesCategory =
      categoryFilter === "all" || trip.category === categoryFilter

    if (!matchesCategory) {
      return false
    }

    if (!normalizedSearchTerm) {
      return true
    }

    const reviewText = trip.reviews
      .map((review) => `${getReviewAuthor(review)} ${review.comment || ""}`)
      .join(" ")
      .toLowerCase()

    const tripText = `${trip.name} ${trip.destination} ${trip.categoryLabel}`.toLowerCase()

    return tripText.includes(normalizedSearchTerm) || reviewText.includes(normalizedSearchTerm)
  })

  const sortedTrips = [...filteredTrips].sort((left, right) => {
    const leftLastReview = left.lastReviewAt ? new Date(left.lastReviewAt).getTime() : 0
    const rightLastReview = right.lastReviewAt ? new Date(right.lastReviewAt).getTime() : 0

    if (sortBy === "rating-desc") {
      return (
        right.serviceRating - left.serviceRating ||
        right.reviewersCount - left.reviewersCount ||
        rightLastReview - leftLastReview
      )
    }

    if (sortBy === "reviewers-desc") {
      return (
        right.reviewersCount - left.reviewersCount ||
        right.reviewsCount - left.reviewsCount ||
        right.totalTripTravelers - left.totalTripTravelers ||
        right.serviceRating - left.serviceRating ||
        rightLastReview - leftLastReview
      )
    }

    if (sortBy === "travelers-desc") {
      return (
        right.totalTripTravelers - left.totalTripTravelers ||
        right.reviewersCount - left.reviewersCount ||
        right.reviewsCount - left.reviewsCount ||
        right.serviceRating - left.serviceRating ||
        rightLastReview - leftLastReview
      )
    }

    return (
      rightLastReview - leftLastReview ||
      right.serviceRating - left.serviceRating ||
      right.reviewersCount - left.reviewersCount
    )
  })

  const displayedTrips =
    tripListExpanded || sortedTrips.length <= TRIP_LIST_PREVIEW_LIMIT
      ? sortedTrips
      : sortedTrips.slice(0, TRIP_LIST_PREVIEW_LIMIT)

  const visibleReviewsCount = sortedTrips.reduce(
    (acc, trip) => acc + trip.reviewsCount,
    0
  )

  if (loading || summaryLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <div className="text-lg font-medium text-muted-foreground animate-pulse">
          กำลังเตรียมข้อมูลข้อมูลวิเคราะห์...
        </div>
      </div>
    )
  }

  return (
    <div className="summary-theme min-h-screen bg-background p-6">
      <header className="mx-auto flex items-center justify-between mb-8 max-w-7xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">AI Insight</h1>
          </div>
        </div>
        <Button
          disabled={isUpdating}
          onClick={handleGenerate}
          className={`flex items-center gap-2 rounded-full px-4 text-sm font-medium shadow-sm transition ${isUpdating
            ? "bg-primary/60 text-primary-foreground/80"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
        >
          <RefreshCw className={`h-4 w-4 ${isUpdating ? "animate-spin" : ""}`} />
          {isUpdating ? "กำลังวิเคราะห์..." : "อัปเดตการวิเคราะห์"}
        </Button>
      </header>

      <main className="mx-auto py-0 max-w-7xl">
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="py-2">
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-semibold text-muted-foreground">
                จำนวนรีวิวทั้งหมด
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">
                    {totalReviews}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-2">
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-semibold text-muted-foreground">
                คะแนนความพึงพอใจ (CSAT)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">
                    {averageRating.toFixed(1)}/5
                  </div>
                  {ratingDeltaMonth !== 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <TrendingUp
                        className={`h-4 w-4 ${ratingDeltaMonth >= 0
                          ? "text-green-500"
                          : "rotate-180 text-rose-500"
                          }`}
                      />
                      <span
                        className={
                          ratingDeltaMonth >= 0 ? "text-green-600 font-medium" : "text-rose-600 font-medium"
                        }
                      >
                        {ratingDeltaMonth > 0 ? "+" : ""}
                        {ratingDeltaMonth.toFixed(1)}
                      </span>
                      <span>เทียบเดือนก่อน</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-2">
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-semibold text-muted-foreground">
                รีวิวเชิงบวก
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="text-sm text-muted-foreground">กำลังโหลด...</div>
              ) : summary ? (
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                    <ThumbsUp className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground">
                      {summary.sentiment.positive.percentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {summary.sentiment.positive.count} รีวิว
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  รอการวิเคราะห์...
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="py-2">
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-semibold text-muted-foreground">
                จุดที่ต้องปรับปรุง
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="text-sm text-muted-foreground">กำลังโหลด...</div>
              ) : summary ? (
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground">
                      {summary.issues.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {summary.issues.filter((i) => i.severity === "critical").length}{" "}
                      ปัญหาสำคัญ
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  รอการวิเคราะห์...
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 overflow-hidden py-6">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">ข้อเสนอแนะจาก AI</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!summary ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-8 text-center text-muted-foreground">
                ยังไม่มีข้อมูลการวิเคราะห์ กดปุ่ม "อัปเดตการวิเคราะห์" เพื่อเริ่ม
              </div>
            ) : (
              (() => {
                const suggestionItems = suggestionItemsFromSummary(summary)
                return (
              <div className="space-y-8">
                {(summary.highlights?.length ?? 0) > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <Heart className="h-5 w-5 fill-emerald-500/25 text-emerald-600" />
                      <h4 className="text-base font-semibold tracking-tight">
                        จุดเด่นที่ลูกค้าชื่นชม
                      </h4>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                      {(summary.highlights ?? []).map((h, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white px-4 py-4 shadow-sm"
                        >
                          <Badge
                            variant="outline"
                            className="absolute right-3 top-3 border-emerald-200 bg-white/90 text-emerald-800 hover:bg-white"
                          >
                            {h.mentions} รีวิว
                          </Badge>
                          <h5 className="pr-20 text-sm font-semibold text-emerald-950 leading-snug">
                            {h.title}
                          </h5>
                          <p className="mt-2 text-sm text-emerald-900/80 leading-relaxed">
                            {h.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summary.issues.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-amber-900">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <h4 className="text-base font-semibold tracking-tight">
                        ประเด็นที่ควรปรับปรุง
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {summary.issues.map((issue, idx) => (
                        <Alert
                          key={idx}
                          className={`relative overflow-hidden ${issue.severity === "critical"
                            ? "border-destructive/60 bg-destructive/10"
                            : issue.severity === "warning"
                              ? "border-amber-500/60 bg-amber-500/10"
                              : "border-blue-500/60 bg-blue-500/10"
                            }`}
                        >
                          <Badge
                            variant={issue.severity === "critical" ? "destructive" : "outline"}
                            className={`absolute right-3 top-3 ${issue.severity === "warning"
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200"
                              : issue.severity === "critical"
                                ? ""
                                : "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"
                              }`}
                          >
                            {issue.mentions} รีวิว
                          </Badge>
                          <AlertCircle
                            className={`h-5 w-5 ${issue.severity === "critical"
                              ? "text-destructive"
                              : issue.severity === "warning"
                                ? "text-amber-500"
                                : "text-blue-500"
                              }`}
                          />
                          <AlertDescription className="pt-1">
                            <div className="pr-20">
                              <h4 className="mb-1 font-semibold text-foreground">
                                {issue.title}
                              </h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {issue.description}
                              </p>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {suggestionItems.length > 0 && (
                  <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-b from-emerald-50/40 to-white p-5 sm:p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-emerald-950">
                          คำแนะนำเพื่อการพัฒนา
                        </h5>
                        <p className="text-xs text-emerald-800/70">
                          แนวปฏิบัติที่ปรับใช้กับทีมงานได้ทันที
                        </p>
                      </div>
                    </div>
                    <ol className="space-y-0 divide-y divide-emerald-100 rounded-lg border border-emerald-100/80 bg-white/80">
                      {suggestionItems.map((item, i) => (
                        <li
                          key={i}
                          className="flex gap-3 px-3 py-3 text-sm text-slate-800 first:rounded-t-lg last:rounded-b-lg sm:gap-4 sm:px-4"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-sm">
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1 pt-0.5 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
                )
              })()
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between py-6">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">ทริปที่มีเสียงตอบรับสูง</CardTitle>
                  <CardDescription>
                    แสดงทริปที่มีคนให้คะแนนมากที่สุดก่อน — กดแถวเพื่ออ่านรีวิว
                    {sortedTrips.length > TRIP_LIST_PREVIEW_LIMIT && !tripListExpanded
                      ? ` (ย่อ ${TRIP_LIST_PREVIEW_LIMIT} ทริปแรก)`
                      : null}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="rounded-md font-normal">
                    {filteredTrips.length} ทริปที่ตรงตัวกรอง
                  </Badge>
                  <Badge variant="outline" className="rounded-md font-normal">
                    {visibleReviewsCount} รีวิว
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-b bg-background px-4 py-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="ค้นหาทริป ปลายทาง หรือข้อความในรีวิว..."
                      className="pl-9 bg-white"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full min-w-[132px] sm:w-[150px] bg-white">
                        <SelectValue placeholder="หมวดหมู่" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        {categoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as TripSortOption)}>
                      <SelectTrigger className="w-full min-w-[200px] sm:w-[220px] bg-white">
                        <SelectValue placeholder="เรียงลำดับ" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIP_SORT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {sortedTrips.length === 0 ? (
                  <EmptyReviewsState message="ไม่พบทริปที่ตรงกับการค้นหาหรือตัวกรอง" />
                ) : (
                  <Accordion type="multiple" className="w-full space-y-2">
                    {displayedTrips.map((trip) => (
                      <AccordionItem
                        key={trip.id}
                        value={trip.id}
                        className="border rounded-lg overflow-hidden px-0 bg-card shadow-sm"
                      >
                        <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-3 py-3 sm:px-4 [&[data-state=open]]:bg-muted/20">
                          <div className="flex flex-1 flex-col gap-3 text-left sm:flex-row sm:items-center sm:gap-4 min-w-0 pr-2">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="h-11 w-[4.5rem] shrink-0 overflow-hidden rounded-md border bg-muted">
                                <img
                                  src={trip.image}
                                  className="h-full w-full object-cover"
                                  alt=""
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm leading-snug line-clamp-2" title={trip.name}>
                                  {trip.name}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{trip.destination}</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:justify-end sm:shrink-0">
                              <span
                                className="inline-flex items-center gap-1 tabular-nums rounded-md border bg-background px-2 py-0.5 font-semibold text-primary"
                                title="คะแนนบริการเฉลี่ย"
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                                {formatReviewScore(trip.serviceRating)}
                              </span>
                              <span className="text-muted-foreground tabular-nums">
                                <Users className="inline h-3 w-3 mr-0.5 -translate-y-px" />
                                {trip.totalTripTravelers} เดินทาง
                              </span>
                              <Badge variant="secondary" className="font-normal tabular-nums">
                                {trip.reviewersCount} คนรีวิว
                              </Badge>
                              <span className="text-muted-foreground tabular-nums hidden sm:inline">
                                {trip.reviewsCount} ข้อความ
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="bg-muted/20 border-t">
                          <div className="p-3 sm:p-4 space-y-3">
                            {trip.reviews.map((review) => (
                              <div
                                key={review.id}
                                className="relative rounded-lg border bg-background p-3 shadow-sm group"
                              >
                                <div className="flex justify-between items-start gap-2 mb-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground border">
                                      {getReviewAuthor(review).charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold truncate">
                                        {getReviewAuthor(review)}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {formatThaiDateTime(review.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-1 shrink-0">
                                    <div className="flex items-center gap-1 tabular-nums text-right">
                                      <span className="text-[10px] text-muted-foreground font-normal">
                                        บริการ
                                      </span>
                                      <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                                      <span className="text-xs font-bold text-primary">
                                        {formatReviewScore(review.service_rating)}
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        setDeleteTarget({
                                          reviewId: review.id,
                                          name: getReviewAuthor(review),
                                        })
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm text-foreground/90 leading-relaxed pl-10 border-l-2 border-primary/25 ml-1 py-0.5">
                                  {review.comment || (
                                    <span className="italic text-muted-foreground">ไม่มีข้อเสนอแนะ</span>
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}

                {sortedTrips.length > TRIP_LIST_PREVIEW_LIMIT && (
                  <div className="mt-4 flex justify-center border-t pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setTripListExpanded((prev) => !prev)}
                    >
                      {tripListExpanded
                        ? `แสดงน้อยลง (${TRIP_LIST_PREVIEW_LIMIT} ทริป)`
                        : `แสดงทั้งหมดอีก ${sortedTrips.length - TRIP_LIST_PREVIEW_LIMIT} ทริป`}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="self-start py-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">สรุปสัดส่วนคะแนน</CardTitle>
              <CardDescription>ภาพรวมความพึงพอใจแยกตามระดับดาว</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {(summary?.ratings_stats || ratingsStats).map((rating) => (
                  <div key={rating.stars} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 font-medium">
                        {rating.stars} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </div>
                      <div className="text-muted-foreground">
                        <span className="text-foreground font-semibold">{rating.count}</span> รีวิว ({rating.percentage}%)
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                           rating.stars >= 4 ? 'bg-emerald-500' : rating.stars === 3 ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${rating.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-4 rounded-xl border border-primary/20 bg-primary/5 py-6">
                 <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Insight วันนี้
                 </h5>
                 <p className="text-xs text-slate-600 leading-relaxed">
                    จากการวิเคราะห์ {summary?.total_reviews || totalReviews} รีวิวล่าสุด พบว่าค่าเฉลี่ยความพึงพอใจโดยรวมอยู่ที่ {(summary?.average_rating || averageRating).toFixed(2)}/5.00 คะแนน 
                    {(summary?.average_rating || averageRating) >= 4 ? " ซึ่งอยู่ในเกณฑ์ดีเยี่ยม" : " ทีมงานควรเร่งตรวจสอบจุดที่ต้องปรับปรุงเพื่อรักษามาตรฐานการบริการ"}
                 </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบรีวิว</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบคำวิจารณ์ของ <strong>{deleteTarget?.name}</strong> ใช่หรือไม่? 
              การกระทำนี้จะไม่สามารถย้อนกลับได้และจะมีผลต่อการคำนวณคะแนนเฉลี่ยใหม่
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-full">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 rounded-full"
              disabled={isDeleting}
              onClick={handleDeleteReview}
            >
              {isDeleting ? "กำลังลบ..." : "ลบออกอย่างถาวร"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
