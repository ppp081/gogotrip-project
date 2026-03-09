import { useState, useEffect } from "react"
import { MessageSquare, Star, TrendingUp, AlertCircle, Sparkles, RefreshCw, MapPin, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { GetTripsList, GetRatingsList } from "@/api/trip"
import type { Rating } from "@/api/trip"
import "./summary-theme.css"

interface EnrichedTrip {
  id: string
  name: string
  destination: string
  image: string
  date: string
  price: number
  rating: number
  reviewsCount: number
  category: string
  reviews: Rating[]
}

export default function AIInsightDashboard() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [trips, setTrips] = useState<EnrichedTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingsStats, setRatingsStats] = useState([
    { stars: 5, count: 0, percentage: 0 },
    { stars: 4, count: 0, percentage: 0 },
    { stars: 3, count: 0, percentage: 0 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
  ])
  const [totalReviews, setTotalReviews] = useState(0)
  const [averageRating, setAverageRating] = useState(0)


  useEffect(() => {
    async function fetchData() {
      try {
        const [tripsData, ratingsData] = await Promise.all([
          GetTripsList(),
          GetRatingsList()
        ])

        // Calculate global stats
        if (ratingsData && Array.isArray(ratingsData)) {
          const total = ratingsData.length
          setTotalReviews(total)

          if (total > 0) {
            const sum = ratingsData.reduce((acc, r) => acc + (r.trip_rating || 0), 0)
            setAverageRating(sum / total)

            // Distribution
            const counts = [0, 0, 0, 0, 0, 0] // 0-5
            ratingsData.forEach(r => {
              const stars = Math.round(r.trip_rating || 0)
              if (stars >= 1 && stars <= 5) counts[stars]++
            })

            const stats = [5, 4, 3, 2, 1].map(star => ({
              stars: star,
              count: counts[star],
              percentage: total > 0 ? Math.round((counts[star] / total) * 100) : 0
            }))
            setRatingsStats(stats)
          }
        }

        if (tripsData && Array.isArray(tripsData)) {
          const processed = tripsData.map(t => {
            // Find ratings for this trip
            // Note: trip.id is number, rating.trip might be number or string
            // We strip any dashes just in case UUID comparison is tricky, but String() should be enough if exact.
            // If trip.id is 1 and rating.trip is "1", match.
            const tripRatings = (ratingsData || []).filter(r => String(r.trip) === String(t.id))

            const avgRating = tripRatings.length > 0
              ? tripRatings.reduce((acc, r) => acc + (r.trip_rating || 0), 0) / tripRatings.length
              : 0 // Default to 0 if no ratings

            return {
              id: String(t.id),
              name: t.name || "Unknown Trip",
              destination: t.province || "Unknown",
              image: t.thumbnail_image || "https://images.unsplash.com/photo-1499856871958-5b9627545d1a",
              date: t.start_date ? new Date(t.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : "-",
              price: parseFloat(t.price_per_person || "0"),
              rating: avgRating,
              reviewsCount: tripRatings.length,
              category: t.category || "General",
              reviews: tripRatings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            }
          })

          // Sort trips by recent activity or rating count? 
          setTrips(processed)
        }
      } catch (e) {
        console.error("Failed to fetch data", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const faqs = [
    { id: 1, question: "แพ็กเกจทัวร์มีอะไรบ้าง?", responses: 156 },
    { id: 2, question: "จะดื่มความอกเป็นอย่างไร?", responses: 134 },
    { id: 3, question: "ความเสี่ยมอะไรไม่ควร?", responses: 98 },
  ]

  return (
    <div className="summary-theme min-h-screen bg-background">
      {/* Header */}
      <header className="mx-auto flex items-center justify-between">

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
          onClick={() => {
            if (isUpdating) return
            setIsUpdating(true)
            window.setTimeout(() => setIsUpdating(false), 2500)
          }}
          className={`flex items-center gap-2 rounded-full px-4 text-sm font-medium shadow-sm transition ${isUpdating
            ? "bg-primary/60 text-primary-foreground/80"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
        >
          <RefreshCw className={`h-4 w-4 ${isUpdating ? "animate-spin" : ""}`} />
          {isUpdating ? "กำลังวิเคราะห์..." : "อัปเดตการวิเคราะห์"}
        </Button>

      </header>

      {/* Main Content */}
      <main className="mx-auto py-8">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Total Reviews Card */}
          <Card className="py-4">
            <CardHeader>
              <CardDescription className="text-sm text-muted-foreground">จำนวนรีวิวทั้งหมด</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">{totalReviews}</div>

                </div>
              </div>
            </CardContent>
          </Card>

          {/* CSAT Score Card */}
          <Card className="py-4">
            <CardHeader>
              <CardDescription className="text-sm text-muted-foreground">คะแนนความพึงพอใจ (CSAT)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">{averageRating.toFixed(1)}/5</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-primary">+0.3</span>
                    <span>จากเดือนที่แล้ว</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Suggestions */}
        <Card className="mb-8 py-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">ข้อเสนอแนะจาก AI</CardTitle>
            </div>

          </CardHeader>
          <CardContent>
            <Alert className="border-destructive/50 bg-destructive/5">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <AlertDescription>
                <div className="mb-3">
                  <h4 className="mb-1 font-semibold text-foreground">ประเด็นที่ตรวจพบ</h4>
                  <p className="text-sm text-muted-foreground">ลูกค้า 5 คน ระบุว่าโปรแกรมทริปเดินป่าที่ภูชี้ฟ้าจัดกิจกรรมหนักต่อเนื่อง 2 วัน ทำให้รู้สึกเหนื่อยล้า</p>
                </div>
                <div className="mb-4">
                  <h5 className="mb-2 text-sm font-medium text-foreground">คำแนะนำ:</h5>
                  <p className="text-sm text-muted-foreground">
                    ควรปรับตารางกิจกรรมให้ สลับระหว่างกิจกรรมหนักและเบา เพื่อลดความเหนื่อยและเพิ่มความพึงพอของลูกค้า
                  </p>
                </div>

              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Trip Ratings Accordion */}
        <Card className="mb-8 overflow-hidden py-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">รายละเอียดคะแนนรายทริป</CardTitle>
            <CardDescription>คลิกที่รายการเพื่อดูรายละเอียดรีวิว</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">กำลังโหลดข้อมูล...</div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {trips.map((trip) => (
                  <AccordionItem key={trip.id} value={trip.id} className="border-b px-6">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex w-full items-center justify-between pr-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-16 overflow-hidden rounded-md bg-muted">
                            <img src={trip.image} alt={trip.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-foreground">{trip.name}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {trip.destination}
                              <span className="mx-1">•</span>
                              <Calendar className="h-3 w-3" /> {trip.date}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-1 font-bold text-foreground">
                              <Star className="h-4 w-4 fill-primary text-primary" />
                              {trip.rating.toFixed(1)}
                            </div>
                            <div className="text-xs text-muted-foreground">{trip.reviewsCount} รีวิว</div>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2 pb-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ลูกค้า</TableHead>
                              <TableHead>คะแนน</TableHead>
                              <TableHead>วันที่</TableHead>
                              <TableHead>ความคิดเห็น</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {trip.reviews.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                  ยังไม่มีรีวิวสำหรับทริปนี้
                                </TableCell>
                              </TableRow>
                            ) : (
                              trip.reviews.map((review) => (
                                <TableRow key={review.id}>
                                  <TableCell className="font-medium max-w-[150px] truncate" title={String(review.user)}>
                                    {/* Display truncated User ID or placeholder */}
                                    User {String(review.user).slice(0, 6)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-3 w-3 ${i < review.trip_rating ? "fill-primary text-primary" : "text-muted"}`}
                                        />
                                      ))}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                    {new Date(review.created_at).toLocaleDateString('th-TH')}
                                  </TableCell>
                                  <TableCell className="max-w-md">{review.comment}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* FAQ and Rating Distribution */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* FAQ Section */}
          <Card className="py-4">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">คำถามที่พบบ่อย</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={faq.id}
                    className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4"
                  >
                    <div className="flex-1">
                      <div className="mb-1 flex items-start gap-3">
                        <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
                        <p className="text-sm font-medium text-foreground">{faq.question}</p>
                      </div>
                      <p className="ml-6 text-xs text-muted-foreground">ถูกถาม {faq.responses} ครั้ง</p>
                    </div>
                    <div className="text-2xl font-bold text-primary">{faq.responses}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rating Distribution */}
          <Card className="py-4">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">การกระจายคะแนน</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">สัดส่วนคะแนนรีวิวจากลูกค้า</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ratingsStats.map((rating) => (
                  <div key={rating.stars} className="flex items-center gap-3">
                    <div className="w-12 text-sm font-medium text-foreground">{rating.stars} ดาว</div>
                    <div className="flex-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${rating.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-20 text-right text-sm text-muted-foreground">
                      {rating.count} ({rating.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
