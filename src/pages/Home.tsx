import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { GetTripsList } from "@/api/trip";
import type { Trip } from "@/api/trip";
import TripSearchSection from "@/components/TripSearchSection";
import { Button } from "@/components/ui/button"
import { MapPin, Tag, ShieldCheck, Heart, Globe2, Leaf, ChevronRight, Flame, Youtube, Landmark, Sun, Mountain } from "lucide-react";
import { Badge } from "@/components/ui/badge"



export const CATEGORY_NAME: Record<string, string> = {
  trending: "ทริปมาแรง",
  youtuber: "ทริปตามรอย Youtuber",
  culture: "ทริปเชิงวัฒนธรรม",
  one_day: "เที่ยววันเดียว",
  trekking: "ทริปเดินป่า",
};

const CATEGORY_TABS = [
  { slug: "trending", label: "ทริปมาแรง", icon: Flame, headline: "ทริปยอดฮิตที่ต้องลอง", description: "รวมทริปสุดปังที่กำลังเป็นกระแสสำหรับสายอินเทรนด์" },
  { slug: "youtuber", label: "ทริปตามรอย Youtuber", icon: Youtube, headline: "เส้นทางตามรอยครีเอเตอร์", description: "ออกเดินทางตามคลิปรีวิวสุดโด่งดัง" },
  { slug: "culture", label: "ทริปเชิงวัฒนธรรม", icon: Landmark, headline: "สัมผัสเสน่ห์วัฒนธรรม", description: "เรียนรู้รากเหง้าและวิถีชีวิตท้องถิ่น" },
  { slug: "one_day", label: "เที่ยววันเดียว", icon: Sun, headline: "ทริปสั้นๆ แต่อิ่มใจ", description: "ไปเช้าเย็นกลับที่จัดเต็มเต็มวัน" },
  { slug: "trekking", label: "ทริปเดินป่า", icon: Mountain, headline: "ผจญภัยในธรรมชาติ", description: "ปีนป่าย เดินป่า ชมวิวสวย" },
];

export default function Home() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GetTripsList().then((data) => {
      setTrips(data);
      console.log(data);
      setLoading(false);
    });
  }, []);

  const [activeCategory, setActiveCategory] = useState<string>("trending");
  




  // ฟิลเตอร์ตาม category + search
  // const filteredTrips = useMemo(() => {
  //   const base =
  //     selected && selected in CATEGORY_NAME
  //       ? trips.filter((t) => t.category === selected)
  //       : trips;
  //   return base.filter(matchesSearch);
  // }, [selected, searchQuery, trips]);

  const currentCategory = CATEGORY_TABS.find(tab => tab.slug === activeCategory)!;
  const filteredTrips = trips.filter(trip => {
    const categories = trip.category.split(",").map(c => c.trim());
    return categories.includes(activeCategory);
  });


  if (loading)
  return (
    <div className="flex min-h-screen items-center justify-center bg-background animate-fade-in-out">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-lg font-medium text-muted-foreground">กำลังโหลดทริป...</p>
      </div>
    </div>
  );



  return (
    <div className="min-h-screen min-w-screen bg-white">
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/cover.png"
            alt="Mirror Lake Valley"
            className="object-cover object-center w-full h-full"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="relative z-10 text-center text-white max-w-4xl px-6">
          <h1 className="text-5xl font-bold mb-6 leading-tight thai-title text-shadow">
            ออกไปหาประสบการณ์ใหม่ๆ <br />ให้ชีวิตมีความหมายมากขึ้น
          </h1>

          <p className="text-xl mb-8 max-w-2xl mx-auto leading-relaxed thai-title text-shadow-sm">
            สร้างเรื่องราวการเดินทางที่มีแต่รอยยิ้ม และความประทับใจ  
            ทุกครั้งที่เราออกเดินทางสิ่งเดียวที่เราจะเจอเหมือนกันคือความสวยงามของธรรมชาติ 
            ที่มาพร้อมกับมิตรภาพ ทำให้การเดินทางของคุณมีความหมายและพิเศษที่สุด
          </p>

        </div>

        {/* Navigation arrows removed */}
      </section>

      {/* Popular Destinations 2025 */}
      <section className="py-16 px-6">
        <TripSearchSection trips={trips}/>
      </section>


      <section id="explore-trip-section" className="px-6 py-16 scroll-mt-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-3">สำรวจทริปตามหมวดหมู่</h2>
            <p className="text-gray-600">
              เลือกหมวดหมู่ที่สนใจแล้วค้นหาทริปในสไตล์ของคุณ ทั้งทริปมาแรง ตามรอยรีวิว ไปเช้าเย็นกลับ และสายลุย
            </p>
          </div>

          <div className="flex justify-between gap-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeCategory === tab.slug;
              return (
                <button
                  key={tab.slug}
                  type="button"
                  role="tab"
                  id={`tab-${tab.slug}`}
                  aria-controls={`tab-panel-${tab.slug}`}
                  aria-selected={isActive}
                  onClick={() => {
                      setActiveCategory(tab.slug)
                      console.log(tab.slug)
                    }}

                  className={`flex min-w-[150px] flex-col rounded-b-none border-b-0 w-xl items-center gap-2 rounded-3xl border py-4 transition-all focus:outline-none cursor-pointer ${
                    isActive
                      ? "bg-gray text-slate-900 shadow-lg border-t-1 border-input hover:shadow-xl"
                      : "bg-gray-300/20 text-gray-600 border-gray-200 hover:bg-white"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${isActive ? "text-indigo-500" : "text-gray-500"}`} />
                  <span className="text-sm font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div
            id={`tab-panel-${activeCategory}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeCategory}`}
            className="rounded-3xl bg-white p-8 shadow-xl rounded-t-none"
          >
            <div className="text-center sm:text-left">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{currentCategory.headline}</h3>
              <p className="mt-2 text-gray-600 max-w-2xl sm:mx-0 mx-auto">{currentCategory.description}</p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {filteredTrips.slice(0, 4).map(trip => (
                <Card
                  key={`${activeCategory}-${trip.id}`}
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
                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          ดูรายละเอียด →
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredTrips.length === 0 && (
                <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-500">
                  ยังไม่มีทริปในหมวดนี้
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                to={`/category/${activeCategory}`}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 hover:border-slate-300 hover:text-slate-900"
              >
                ดูทั้งหมด
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        




          <div className="w-full bg-transparent text-gray-800 mt-8">
            {/* INTRO 2-COLUMN */}
            <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pt-20 pb-12 md:grid-cols-2 md:pt-24 md:pb-16">
              <div className="space-y-5">
                <h2 className="text-3xl font-semibold leading-tight md:text-4xl text-gray-800">
                  Gogo Trip Thailand
                  <br />
                  <span className="font-extrabold text-gray-900">ไปด้วยใจ</span>{" "}
                  <span className="font-extrabold text-gray-900">..ไปด้วยกัน</span>
                </h2>
                <p className="text-gray-600">
                  หากคุณเป็นคนที่หลงรักธรรมชาติ หลงรักการเดินทาง มองหากิจกรรมใหม่ๆ และประสบการณ์ที่น่าจดจำ 
                  เราให้บริการที่มีคุณภาพ ด้วยความทุ่มเทและตั้งใจ ทีมงานเราเห็นความสำคัญในความปลอดภัยของผู้เดินทาง
                  การอยู่ร่วมกับธรรมชาติ และการสร้างรายได้ให้ชุมชนอย่างยั่งยืน
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    className="bg-gray-700 text-white hover:bg-gray-800 cursor-pointer"
                    onClick={() => {
                      document.getElementById("explore-trip-section")?.scrollIntoView({
                        behavior: "smooth",
                      })
                    }}
                  >
                    สำรวจทริป
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100"
                  >
                    <Link to="https://lin.ee/JYiO7BG"
                      target="_blank"
                    >
                      ติดต่อเรา
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="relative">
                <img
                  src="https://images.pexels.com/photos/913215/pexels-photo-913215.jpeg"
                  alt="About image"
                  className="relative h-full w-full rounded-[24px] border border-gray-200 object-cover"
                />
              </div>
            </section>

            {/* VALUES */}
            <section className="mx-auto max-w-7xl px-6 pb-12 md:pb-16">
              <h3 className="mb-6 text-2xl font-semibold text-gray-800">สิ่งที่เราให้ความสำคัญ</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                {[
                  { icon: <ShieldCheck className="mr-2 size-4" />, title: "ความปลอดภัย", body: "มาตรฐานทุกการเดินทางและอุปกรณ์ ครอบคลุมทุกกิจกรรม" },
                  { icon: <Heart className="mr-2 size-4" />, title: "บริการด้วยใจ", body: "ให้บริการและดูแลลูกค้าครบวงจร ตั้งแต่ขั้นตอนการจองจนสิ้นสุดการเดินทาง" },
                  { icon: <Globe2 className="mr-2 size-4" />, title: "ชุมชนท้องถิ่น", body: "ส่งเสริมการท่องเที่ยวธรรมชาติ และสร้างรายได้ให้กับท้องถิ่น" },
                  { icon: <Leaf className="mr-2 size-4" />, title: "รักษ์ธรรมชาติ", body: "มุ่งเน้นกิจกรรมท่องเที่ยวที่เป็นมิตรกับสิ่งแวดล้อม และคงไว้ซึ่งสมดุลของธรรมชาติ" },
                ].map((v) => (
                  <Card key={v.title} className="border-gray-200 bg-gray-50 shadow-sm hover:shadow-md transition">
                    <CardContent className="flex flex-col gap-1 p-4">
                      <div className="flex items-center text-gray-600">{v.icon}<span className="font-medium">{v.title}</span></div>
                      <p className="text-sm text-gray-600">{v.body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* CTA */}
            <section className="mx-auto max-w-7xl px-6 pb-16">
              <div className="rounded-2xl border border-gray-200 bg-gray-100 p-6 text-center shadow-md md:p-10">
                <h4 className="text-xl font-semibold md:text-2xl text-gray-800">พร้อมออกเดินทางไปด้วยกันไหม?</h4>
                <p className="mt-1 text-gray-600">เลือกทริปที่ใช่ หรือติดต่อทีมงานเพื่อออกแบบประสบการณ์ของคุณ</p>
                <div className="mt-4 flex justify-center gap-3">
                  <div className="flex justify-center">
                    <a
                      href="https://lin.ee/JYiO7BG"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full bg-[#06C755] px-6 py-3 text-white font-semibold hover:opacity-90"
                    >
                      + เพิ่มเพื่อน LINE
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>

      </section>
    </div>
  );
}
