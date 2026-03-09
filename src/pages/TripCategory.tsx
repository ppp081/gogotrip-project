import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"

import { GetTripsList } from "@/api/trip"
import { Badge } from "@/components/ui/badge"
import type { Trip } from "@/api/trip"
import { MapPin, Tag } from "lucide-react"

const CATEGORY_NAME: Record<string, string> = {
  trending: "ทริปมาแรง",
  youtuber: "ทริปตามรอย Youtuber",
  culture: "ทริปเชิงวัฒนธรรม",
  one_day: "เที่ยววันเดียว",
  trekking: "ทริปเดินป่า",
}
export default function TripCategoryPage() {
  const { activeCategory } = useParams()
  const [trips, setTrips] = useState<Trip[]>([])

  useEffect(() => {
    const fetchTrips = async () => {
      const results = await GetTripsList(activeCategory)
      setTrips(results)
    }
    fetchTrips()
  }, [activeCategory])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-20 md:py-28">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="mb-6 text-balance font-sans text-4xl font-bold tracking-tight text-black md:text-6xl">
            {Object.entries(CATEGORY_NAME).find(([k]) => activeCategory?.includes(k))?.[1] || activeCategory}            
          </h1>
          <p className="text-pretty text-lg text-black/40 md:text-xl">
            สำรวจทริปในหมวดนี้จากทั่วประเทศ ค้นหาประสบการณ์ที่ใช่สำหรับคุณ
          </p>
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </section>
      

      {/* Trips Grid */}
      <section className="container mx-auto px-4 py-6 pb-32">
        {trips.length === 0 ? (
          <p className="text-center text-muted-foreground">ยังไม่มีทริปในหมวดนี้</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {trips.map((trip) => (
              <Card
                key={trip.id}
                className="group overflow-hidden border border-border bg-card transition-all hover:shadow-lg"
              >
                <CardContent className="p-0">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={trip.thumbnail_image}
                      alt={trip.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <Badge className="absolute left-4 top-4 bg-accent text-accent-foreground">
                      <Tag className="mr-1 h-3 w-3" /> {trip.category || "ทั่วไป"}
                    </Badge>
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white text-sm">
                      <MapPin className="h-4 w-4" />
                      {trip.province}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-card-foreground line-clamp-1">
                      {trip.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {trip.description || "ไม่มีคำอธิบายเพิ่มเติม"}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-primary/70 font-semibold">
                        {Number(trip.price_per_person || 0).toLocaleString()} ฿
                      </span>
                      <Link
                        to={`/blog/${trip.id}`}
                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        ดูรายละเอียด →
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
