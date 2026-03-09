import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";
import { CATEGORY_NAME } from "@/pages/Home";
import type { Trip } from "@/api/trip";
import { GetTripById, GetTripsList } from "@/api/trip";
import { TripMarkdown } from "@/components/TripMarkdown"
import { Tag } from "lucide-react"

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";




export default function Blog_Detail() {
  const { blogId } = useParams<{ blogId: string }>();
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [otherTrips, setOtherTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!blogId) return;
    GetTripById(blogId).then((trip) => setCurrentTrip(trip));
    GetTripsList().then((trips) =>
      setOtherTrips(trips.filter((t) => t.id !== blogId).slice(0, 3))
    );
    setLoading(false);
  }, [blogId]);

  if (loading || !currentTrip) {
    return <p className="p-10 text-center">กำลังโหลดรายละเอียดทริป...</p>;
  }
  
  const galleryImages = currentTrip.images?.filter((img) => !img.image_thumbnail) || [];
  console.log(currentTrip)
  const categoryLabel =
    currentTrip.category && currentTrip.category in CATEGORY_NAME
      ? CATEGORY_NAME[currentTrip.category]
      : currentTrip.category;

  return (
    <div className="min-h-screen min-w-screen bg-white">
      {/* Back Button */}
      {/* Article Header */}
      <article className="w-full">

        <article className="relative w-full h-[75vh] overflow-hidden">
          <img
            src={currentTrip.thumbnail_image}
            alt="trip cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
          
          <div className="absolute inset-0 flex flex-col items-start justify-center text-white z-10 pl-24 thai-title">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight thai-title text-shadow">
              {currentTrip.name}
            </h1>

            {/* Subtitle */}
            <div className="flex flex-row items-start justify-center gap-3">
              {categoryLabel && (
                <div>
                  <Badge className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full shadow-lg">
                    {categoryLabel}
                  </Badge>
                </div>
              )}
              <div className="flex flex-col gap-2 -mt-1">
                <p className="text-xl text-white leading-relaxed text-shadow">
                  {currentTrip.description}
                </p>
                {/* Article Meta */}
                <div className="flex flex-wrap items-center gap-6 mb-8 text-sm text-white text-shadow">
                  <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(currentTrip.start_date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })} -{" "}
                        {new Date(currentTrip.end_date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>

                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{categoryLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* <div className="pt-20 px-6">
          <div className="max-w-4xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              กลับสู่หน้าหลัก
            </Link>
          </div>
        </div> */}

        <section className="max-w-4xl mx-auto px-6 pb-16 py-16">
          
          <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            กลับสู่หน้าหลัก
          </Link>
          
          {categoryLabel && (
            <div className="mb-7">
              <Badge className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                {categoryLabel}
              </Badge>
            </div>
          )}
          
          <div className="flex flex-row justify-between items-center w-full mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            {currentTrip.name}
          </h1>

          <div className="flex justify-center min-w-fit">
                  <a
                    href="https://lin.ee/JYiO7BG"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full bg-[#06C755] px-6 py-1 text-white font-semibold hover:opacity-90 w-fit"
                  >
                    + จองทริป
                  </a>
          </div>
          </div>

          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            {currentTrip.description}
          </p>

          {/* Article Meta */}
          <div className="flex flex-wrap items-center gap-6 mb-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(currentTrip.start_date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })} -{" "}
                  {new Date(currentTrip.end_date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                </span>

            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{categoryLabel}</span>
            </div>
          </div>

          <div className="w-full flex justify-center gap-5">
                {galleryImages.length > 0 && (
                  <div className="w-full flex justify-center gap-3 py-4">
                    {galleryImages.slice(0, 3).map((img) => (
                      <div
                        key={img.id}
                        className="relative w-[320px] h-[380px] overflow-hidden rounded-3xl"
                      >
                        <img
                          src={`${import.meta.env.VITE_BACKEND_API}/images/${img.id}/file/`}
                          alt={currentTrip.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
          <TripMarkdown content={currentTrip.content}/>
          <Separator className="my-12" />
          {/* Related Articles */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">ทริปอื่นๆ</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherTrips.map((trip) => (
                <Card
                  key={trip.id}
                  className="overflow-hidden rounded-2xl border border-slate-100 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
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
          </section>
        </section>
      </article>
    </div>
  )
}
