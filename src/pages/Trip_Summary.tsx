import { useEffect, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import "./summary-theme.css"

type TripTab = "all" | "grouped"
type TripSortOption = "latest-review" | "rating-desc" | "reviewers-desc"

interface EnrichedTrip {
  id: string
  name: string
  destination: string
  image: string
  tripDateLabel: string
  rating: number
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

const TRIP_SORT_OPTIONS: { value: TripSortOption; label: string }[] = [
  { value: "latest-review", label: "วันที่รีวิวล่าสุด" },
  { value: "rating-desc", label: "คะแนนมากไปน้อย" },
  { value: "reviewers-desc", label: "จำนวนคนรีวิวมากไปน้อย" },
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

function ReviewStars({
  value,
  iconClassName = "h-3.5 w-3.5",
}: {
  value: number
  iconClassName?: string
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`${iconClassName} ${index < Math.round(value)
            ? "fill-primary text-primary"
            : "text-muted-foreground/40"
            }`}
        />
      ))}
    </div>
  )
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
  const [activeTab, setActiveTab] = useState<TripTab>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState<TripSortOption>("latest-review")
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

            const totalTripRating = tripRatings.reduce(
              (acc, rating) => acc + (rating.trip_rating || 0),
              0
            )

            const totalServiceRating = tripRatings.reduce(
              (acc, rating) => acc + (rating.service_rating || 0),
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
              rating: totalTripRating / tripRatings.length,
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
        right.rating - left.rating ||
        right.reviewersCount - left.reviewersCount ||
        rightLastReview - leftLastReview
      )
    }

    if (sortBy === "reviewers-desc") {
      return (
        right.reviewersCount - left.reviewersCount ||
        right.reviewsCount - left.reviewsCount ||
        right.rating - left.rating ||
        rightLastReview - leftLastReview
      )
    }

    return (
      rightLastReview - leftLastReview ||
      right.rating - left.rating ||
      right.reviewersCount - left.reviewersCount
    )
  })

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

        <Card className="mb-8 overflow-hidden">
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
              <div className="space-y-6">
                {summary.issues.length > 0 && (
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
                )}
                {summary.suggestion && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      <h5 className="font-semibold text-emerald-900">คำแนะนำเพื่อการพัฒนา</h5>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-700">
                      {summary.suggestion
                        .split(/\n/)
                        .flatMap((line) =>
                          line
                            .split(/(?<=\s)(?=นอกจากนี้|รวมถึง|ควร|และควร|อีกทั้ง|พร้อมทั้ง)|[.。]\s*/)
                            .map((s) => s.replace(/^[-•–]\s*/, "").trim())
                            .filter((s) => s.length > 0)
                        )
                        .map((item, i) => (
                          <li key={i} className="flex gap-2 leading-relaxed">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="border-b">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">รายชื่อทริปและรีวิว</CardTitle>
                  <CardDescription>จัดการและดูรายละเอียดผลตอบรับรายทริป</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-md">{trips.length} ทริป</Badge>
                  <Badge variant="outline" className="rounded-md">{visibleReviewsCount} รีวิว</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 bg-muted/20 border-b">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="หาชื่อทริป, ปลายทาง, หรือเนื้อหารีวิว..."
                      className="pl-9 bg-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[140px] bg-white">
                        <SelectValue placeholder="หมวดหมู่" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        {categoryOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as TripSortOption)}>
                      <SelectTrigger className="w-[160px] bg-white">
                        <SelectValue placeholder="เรียงลำดับ" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIP_SORT_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="p-0">
                 <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TripTab)}>
                  <div className="px-4 pt-2 border-b">
                    <TabsList className="bg-transparent gap-4">
                      <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2">มุมมองทั้งหมด</TabsTrigger>
                      <TabsTrigger value="grouped" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2">กลุ่มตามทริป</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="all" className="m-0">
                     <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead className="w-[280px]">ทริป</TableHead>
                            <TableHead className="text-center">คะแนน</TableHead>
                            <TableHead className="text-center">ผู้เดินทาง</TableHead>
                            <TableHead className="text-right">รีวิวล่าสุด</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedTrips.map(trip => (
                            <TableRow key={trip.id} className="cursor-pointer hover:bg-muted/10">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-14 overflow-hidden rounded-md border min-w-[56px]">
                                    <img src={trip.image} className="h-full w-full object-cover" alt="" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium truncate text-sm" title={trip.name}>{trip.name}</p>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                                       <MapPin className="h-3 w-3" />
                                       {trip.destination}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center">
                                  <span className="font-bold text-sm">{trip.rating.toFixed(1)}</span>
                                  <ReviewStars value={trip.rating} iconClassName="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground">
                                <p className="font-medium text-slate-700">{trip.totalTripTravelers}</p>
                                คน
                              </TableCell>
                              <TableCell className="text-right text-xs whitespace-nowrap">
                                {formatThaiDate(trip.lastReviewAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                     </Table>
                  </TabsContent>

                  <TabsContent value="grouped" className="m-0 p-4">
                    <Accordion type="multiple" className="w-full space-y-3">
                       {sortedTrips.map(trip => (
                        <AccordionItem key={trip.id} value={trip.id} className="border rounded-xl overflow-hidden px-0">
                          <AccordionTrigger className="hover:no-underline px-4 py-3 bg-white">
                             <div className="flex flex-1 items-center gap-4 text-left">
                                <div className="h-12 w-16 overflow-hidden rounded-lg border">
                                  <img src={trip.image} className="h-full w-full object-cover" alt="" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm leading-tight mb-1">{trip.name}</h4>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {trip.rating.toFixed(1)}</span>
                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {trip.totalTripTravelers} คนเดินทาง</span>
                                    <span className="flex items-center gap-1 font-medium text-primary bg-primary/5 px-1.5 py-0.5 rounded">{trip.reviewsCount} รีวิว</span>
                                  </div>
                                </div>
                             </div>
                          </AccordionTrigger>
                          <AccordionContent className="bg-muted/10 border-t">
                             <div className="p-4 space-y-4">
                                {trip.reviews.map(review => (
                                  <div key={review.id} className="relative bg-white p-3 rounded-lg border shadow-sm group">
                                     <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border">
                                            {getReviewAuthor(review).charAt(0)}
                                          </div>
                                          <div>
                                            <p className="text-sm font-semibold">{getReviewAuthor(review)}</p>
                                            <p className="text-[10px] text-muted-foreground">{formatThaiDateTime(review.created_at)}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                          <span className="text-xs font-bold text-amber-600">{review.trip_rating}</span>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all ml-1"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              setDeleteTarget({ reviewId: review.id, name: getReviewAuthor(review) });
                                            }}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                     </div>
                                     <p className="text-sm text-slate-700 leading-relaxed pl-10 border-l-2 border-primary/20 ml-4 py-1">
                                       {review.comment || <span className="italic text-slate-400">ไม่มีข้อเสนอแนะ</span>}
                                     </p>
                                  </div>
                                ))}
                             </div>
                          </AccordionContent>
                        </AccordionItem>
                       ))}
                    </Accordion>
                  </TabsContent>
                 </Tabs>
              </div>
            </CardContent>
          </Card>

          <Card className="self-start">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">สรุปสัดส่วนคะแนน</CardTitle>
              <CardDescription>ภาพรวมความพึงพอใจแยกตามระดับดาว</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {ratingsStats.map((rating) => (
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
              
              <div className="mt-8 p-4 rounded-xl border border-primary/20 bg-primary/5">
                 <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Insight วันนี้
                 </h5>
                 <p className="text-xs text-slate-600 leading-relaxed">
                    จากการวิเคราะห์ {totalReviews} รีวิวล่าสุด พบว่าค่าเฉลี่ยความพึงพอใจโดยรวมอยู่ที่ {averageRating.toFixed(2)}/5.00 คะแนน 
                    {averageRating >= 4 ? " ซึ่งอยู่ในเกณฑ์ดีเยี่ยม" : " ทีมงานควรเร่งตรวจสอบจุดที่ต้องปรับปรุงเพื่อรักษามาตรฐานการบริการ"}
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
