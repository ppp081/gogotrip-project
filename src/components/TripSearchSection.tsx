"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ChevronLeft, ChevronRight, Clock, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import useDebounce from "@/hooks/use-debounce"
import { Link } from "react-router-dom";
import type { Trip } from "@/api/trip"
import { MapPin, Tag } from "lucide-react"

interface Props {
  trips: Trip[]
  // CATEGORY_NAME: Record<string, string>
}

export default function TripSearchSection({ trips }: Props) {
  const [query, setQuery] = useState("")
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>(trips)
  const [isFocused, setIsFocused] = useState(false)
  const debouncedQuery = useDebounce(query, 250)
  const destRef = useRef<HTMLDivElement | null>(null)

  const scrollDest = (dir: "left" | "right") => {
    const el = destRef.current
    if (!el) return
    const amount = Math.max(el.clientWidth * 0.9, 300)
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" })
  }

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setFilteredTrips(trips)
    } else {
      const normalized = debouncedQuery.toLowerCase().trim()
      const filtered = trips.filter((t) => t.name.toLowerCase().includes(normalized))
      setFilteredTrips(filtered)
    }
  }, [debouncedQuery, trips])

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="py-16 px-6"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h2 className="text-5xl font-bold mb-4">จุดหมายยอดนิยม ปี 2025</h2>
          <p className="text-gray-600 text-sm mb-6 py-1">
            ค้นพบจุดหมายปลายทางยอดนิยมปี 2025 ที่พร้อมด้วยธรรมชาติสวยงามและประสบการณ์น่าจดจำสำหรับนักเดินทางทุกสไตล์
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="relative w-full max-w-lg mx-auto py-3"
          >
            <Input
              placeholder="ค้นหาทริป เช่น เขาใหญ่ เชียงใหม่..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 150)}
              className="pl-4 pr-10 py-3 h-16 rounded-full border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 border border-gray-300 shadow-2xl  p-1.5 rounded-full cursor-pointer hover:bg-input/30 transition">
              <Search className="h-12 w-12 text-gray-400 p-2.5" />
            </div>
          </motion.div>
        </motion.div>

        <div className="relative mt-10">
          <button
            aria-label="เลื่อนไปทางซ้าย"
            onClick={() => scrollDest("left")}
            className="absolute -left-6 md:-left-10 top-1/2 -translate-y-1/2 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-700 shadow-md hover:bg-gray-300"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            aria-label="เลื่อนไปทางขวา"
            onClick={() => scrollDest("right")}
            className="absolute -right-6 md:-right-10 top-1/2 -translate-y-1/2 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-700 shadow-md hover:bg-gray-300"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div
            ref={destRef}
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <AnimatePresence>
              {filteredTrips.length > 0 ? (
                filteredTrips.slice(0, 8).map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="snap-center flex-none w-[280px] md:w-[360px]"
                  >
                    <Link to={`/blog/${item.id}`}>
                      <Card
                        key={item.id}
                        className="overflow-hidden rounded-2xl border border-slate-100 transition-all duration-300 hover:-translate-y-1"
                      >
                        <CardContent className="p-0">
                          <div className="relative aspect-video overflow-hidden">
                            <img
                              src={item.thumbnail_image}
                              alt={item.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <Badge className="absolute left-4 top-4 bg-accent text-accent-foreground">
                              <Tag className="mr-1 h-3 w-3" /> {item.category || "ทั่วไป"}
                            </Badge>
                            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white text-sm">
                              <MapPin className="h-4 w-4" />
                              {item.province}
                            </div>
                          </div>
                          <div className="p-5">
                            <h3 className="text-lg font-semibold text-card-foreground line-clamp-1">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {item.description || "ไม่มีคำอธิบายเพิ่มเติม"}
                            </p>
                            <div className="mt-4 flex items-center justify-between">
                              <span className="text-primary/70 font-semibold">
                                {Number(item.price_per_person || 0).toLocaleString()} ฿
                              </span>
                              <Link
                                to={`/blog/${item.id}`}
                                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                              >
                                ดูรายละเอียด →
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      {/* <Card className="overflow-hidden transition-all duration-300 pt-0 cursor-pointer hover:-translate-y-0.5 hover:shadow-xl h-full">
                        <div className="aspect-[4/3] relative">
                          <img src={item.thumbnail_image} alt={item.name} className="object-cover w-full h-full" />
                        </div>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500">
                            <span className="flex items-center gap-1 text-gray-500">
                              <Clock className="h-4 w-4" />
                              {new Date(item.start_date).toLocaleString("th-TH", {
                                dateStyle: "long",
                                timeZone: "Asia/Bangkok",
                              })}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 line-clamp-2">{item.name}</h3>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-gray-500">
                              <Users className="h-4 w-4" />2-{item.capacity} คน
                            </span>
                            <span className="font-semibold text-green-600">{Number(item.price_per_person || 0).toLocaleString()} ฿</span>
                          </div>
                        </CardContent>
                      </Card> */}
                    </Link>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="snap-center flex w-full items-center justify-center py-10 text-gray-500"
                >
                  ไม่พบทริปที่ตรงกับคำค้นหา
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
