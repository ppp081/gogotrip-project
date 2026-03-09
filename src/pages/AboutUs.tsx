import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldCheck, Heart, Globe2, Leaf } from "lucide-react"
import { Link } from "react-router-dom"

export default function AboutUs() {
  return (
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
            <Button className="bg-gray-700 text-white hover:bg-gray-800">สำรวจทริป</Button>
            <Button
              asChild
              variant="outline"
              className="border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100"
            >
              <Link to="/#explore-categories">
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
  )
}
