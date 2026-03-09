// src/layout.tsx
import React from 'react'
import { Outlet, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


const CATEGORY_NAME: Record<string, string> = {
  trending: "ทริปมาแรง",
  youtuber: "ทริปตามรอย Youtuber",
  culture: "ทริปเชิงวัฒนธรรม",
  one_day: "เที่ยววันเดียว",
  trekking: "ทริปเดินป่า",
}
const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [searchValue, setSearchValue] = React.useState(searchParams.get("q") || "")

  const navLinkClasses = (isActive: boolean) =>
    `rounded-md px-3 py-2 transition-colors hover:text-gray-900 cursor-pointer hover:bg-transparent ${
      isActive ? "text-gray-900 font-semibold" : "text-gray-700"
    }`

  React.useEffect(() => {
    setSearchValue(searchParams.get("q") || "")
  }, [searchParams])

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const params = new URLSearchParams(searchParams)
    const query = searchValue.trim()
    if (query) {
      params.set("q", query)
    } else {
      params.delete("q")
    }

    navigate({
      pathname: "/",
      search: params.toString() ? `?${params.toString()}` : "",
    })
  }

  return (
    <main>
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
          <div className="w-full mx-auto px-7">
            <div className="flex items-center gap-6 py-4">
              <Link to="/" className="text-3xl font-semibold text-gray-900">
                GoGo Trip
              </Link>

              <nav className="flex items-center gap-2 text-sm md:text-base">
                <Link to="/" className={navLinkClasses(location.pathname === "/")}>
                  หน้าหลัก
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={navLinkClasses(location.pathname.startsWith("/category"))}
                    >
                      หมวดหมู่ทริป
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-56">
                    <DropdownMenuRadioGroup
                      value={location.pathname.split("/")[2] || ""}
                      onValueChange={(value) => navigate(`/category/${value}`)}
                    >
                      {Object.entries(CATEGORY_NAME).map(([key, label]) => (
                        <DropdownMenuRadioItem key={key} value={key}>
                          {label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>


                <Link
                  to="/about"
                  className={navLinkClasses(location.pathname.startsWith("/about"))}
                >
                  เกี่ยวกับเรา
                </Link>
              </nav>

              <div className="ml-auto flex items-center gap-4">
                <Button 
                  asChild 
                  variant="default" 
                  className="rounded-full px-4 py-1"
                >
                  <Link to="/signin">เข้าสู่ระบบ</Link>
                </Button>
              </div>

            </div>
          </div>
        </header>

        <Outlet />


        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 px-6 w-full">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
                <h3 className="text-xl font-bold mb-4">GoGo Trip</h3>
                <p className="text-gray-400">
                แพลตฟอร์มท่องเที่ยวที่คุณไว้วางใจสำหรับการผจญภัยและประสบการณ์ทางวัฒนธรรมอันน่าจดจำทั่วทุกภูมิภาค
                </p>
            </div>
            <div>
                <h4 className="font-semibold mb-4">ลิงก์ด่วน</h4>
                <ul className="space-y-2 text-gray-400">
                <li>
                    <Link to="#" className="hover:text-white">
                    จุดหมายปลายทาง
                    </Link>
                </li>
                <li>
                    <Link to="#" className="hover:text-white">
                    แพ็กเกจทัวร์
                    </Link>
                </li>
                <li>
                    <Link to="#" className="hover:text-white">
                    คู่มือการเดินทาง
                    </Link>
                </li>
                <li>
                    <Link to="#" className="hover:text-white">
                    เกี่ยวกับเรา
                    </Link>
                </li>
                </ul>
            </div>
            <div>
                <h4 className="font-semibold mb-4">ฝ่ายสนับสนุน</h4>
                <ul className="space-y-2 text-gray-400">
                <li>
                    <Link to="#" className="hover:text-white">
                    ศูนย์ช่วยเหลือ
                    </Link>
                </li>
                <li>
                    <Link to="#" className="hover:text-white">
                    ติดต่อทีมงาน
                    </Link>
                </li>
                <li>
                    <Link to="#" className="hover:text-white">
                    เงื่อนไขการให้บริการ
                    </Link>
                </li>
                <li>
                    <Link to="#" className="hover:text-white">
                    นโยบายความเป็นส่วนตัว
                    </Link>
                </li>
                </ul>
            </div>
            <div>
                <h4 className="font-semibold mb-4">ข้อมูลติดต่อ</h4>
                <div className="space-y-2 text-gray-400">
                <p>อีเมล: info@gogotrip.com</p>
                <p>โทรศัพท์: +1 (555) 123-4567</p>
                <p>ที่อยู่: 123 ถนนท่องเที่ยว เมืองผจญภัย</p>
                </div>
            </div>
            </div>
            <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© 2025 GoGo Trip. สงวนลิขสิทธิ์ทั้งหมด</p>
            </div>
        </footer>
    </main>
  )
}

export default MainLayout
