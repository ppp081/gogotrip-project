// src/pages/EmployeeDashboard.tsx
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  DollarSign,
  MapPin,
  MessageSquare,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BOOKING_CREATED_EVENT,
  type BookingCreatedPayload,
  emitNotification,
} from "@/lib/notification-bus";
import { Link } from "react-router-dom";

type RangeKey = "weekly" | "monthly" | "yearly";

interface RevenueDatum {
  name: string;
  value: number;
}

interface RoomDatum {
  name: string;
  occupied: number;
  booked: number;
  available: number;
}

interface Trip {
  id: number;
  name: string;
  bookings: number;
  revenue: number;
}

interface RecentBooking {
  id: number;
  customerName: string;
  trip: string;
  people: number;
  paymentStatus: "Paid" | "Pending" | "Due";
  amount: number;
  bookingDate: string;
}

const RANGE_LABEL: Record<RangeKey, string> = {
  weekly: "รายสัปดาห์",
  monthly: "รายเดือน",
  yearly: "รายปี",
};

const REVENUE_SERIES: Record<RangeKey, RevenueDatum[]> = {
  weekly: [
    { name: "จ.", value: 42 },
    { name: "อ.", value: 58 },
    { name: "พ.", value: 65 },
    { name: "พฤ.", value: 52 },
    { name: "ศ.", value: 48 },
    { name: "ส.", value: 61 },
    { name: "อา.", value: 70 },
  ],
  monthly: [
    { name: "ม.ค.", value: 410 },
    { name: "ก.พ.", value: 432 },
    { name: "มี.ค.", value: 458 },
    { name: "เม.ย.", value: 447 },
    { name: "พ.ค.", value: 472 },
    { name: "มิ.ย.", value: 489 },
    { name: "ก.ค.", value: 501 },
    { name: "ส.ค.", value: 518 },
    { name: "ก.ย.", value: 505 },
    { name: "ต.ค.", value: 523 },
    { name: "พ.ย.", value: 537 },
    { name: "ธ.ค.", value: 552 },
  ],
  yearly: [
    { name: "2021", value: 5100 },
    { name: "2022", value: 5450 },
    { name: "2023", value: 5875 },
    { name: "2024", value: 6120 },
    { name: "2025", value: 6540 },
  ],
};

const GUEST_SERIES: Record<RangeKey, RevenueDatum[]> = {
  weekly: [
    { name: "จ.", value: 45 },
    { name: "อ.", value: 52 },
    { name: "พ.", value: 68 },
    { name: "พฤ.", value: 58 },
    { name: "ศ.", value: 48 },
    { name: "ส.", value: 41 },
    { name: "อา.", value: 36 },
  ],
  monthly: [
    { name: "ม.ค.", value: 280 },
    { name: "ก.พ.", value: 265 },
    { name: "มี.ค.", value: 315 },
    { name: "เม.ย.", value: 298 },
    { name: "พ.ค.", value: 332 },
    { name: "มิ.ย.", value: 347 },
    { name: "ก.ค.", value: 352 },
    { name: "ส.ค.", value: 368 },
    { name: "ก.ย.", value: 341 },
    { name: "ต.ค.", value: 355 },
    { name: "พ.ย.", value: 362 },
    { name: "ธ.ค.", value: 376 },
  ],
  yearly: [
    { name: "2021", value: 3620 },
    { name: "2022", value: 3890 },
    { name: "2023", value: 4215 },
    { name: "2024", value: 4570 },
  ],
};

const ROOM_SERIES: Record<RangeKey, RoomDatum[]> = {
  weekly: [
    { name: "จ.", occupied: 18, booked: 15, available: 17 },
    { name: "อ.", occupied: 22, booked: 12, available: 16 },
    { name: "พ.", occupied: 20, booked: 14, available: 16 },
    { name: "พฤ.", occupied: 19, booked: 10, available: 21 },
    { name: "ศ.", occupied: 25, booked: 11, available: 14 },
    { name: "ส.", occupied: 17, booked: 13, available: 20 },
    { name: "อา.", occupied: 23, booked: 12, available: 15 },
  ],
  monthly: [
    { name: "ม.ค.", occupied: 520, booked: 180, available: 70 },
    { name: "ก.พ.", occupied: 485, booked: 165, available: 90 },
    { name: "มี.ค.", occupied: 498, booked: 174, available: 68 },
    { name: "เม.ย.", occupied: 472, booked: 188, available: 80 },
    { name: "พ.ค.", occupied: 510, booked: 195, available: 75 },
    { name: "มิ.ย.", occupied: 534, booked: 202, available: 64 },
    { name: "ก.ค.", occupied: 546, booked: 208, available: 58 },
    { name: "ส.ค.", occupied: 559, booked: 214, available: 52 },
    { name: "ก.ย.", occupied: 541, booked: 207, available: 63 },
    { name: "ต.ค.", occupied: 553, booked: 213, available: 60 },
    { name: "พ.ย.", occupied: 567, booked: 219, available: 55 },
    { name: "ธ.ค.", occupied: 580, booked: 226, available: 49 },
  ],
  yearly: [
    { name: "2021", occupied: 6120, booked: 2150, available: 930 },
    { name: "2022", occupied: 6395, booked: 2285, available: 890 },
    { name: "2023", occupied: 6670, booked: 2410, available: 840 },
    { name: "2024", occupied: 7055, booked: 2555, available: 780 },
  ],
};

const topTrips: Trip[] = [
  { id: 1, name: "ทริปเดินป่าระยะไกลคลองยัน", bookings: 45, revenue: 225_000 },
  { id: 2, name: "เส้นทางกาแฟเชียงราย", bookings: 38, revenue: 190_000 },
  { id: 3, name: "ผจญภัยเขาใหญ่", bookings: 32, revenue: 128_000 },
  { id: 4, name: "ดอยอินทนนท์ ล่าหมอก", bookings: 28, revenue: 168_000 },
  { id: 5, name: "ทะเลหมอกภูทับเบิก", bookings: 25, revenue: 150_000 },
];

const INITIAL_RECENT_BOOKINGS: RecentBooking[] = [
  {
    id: 1,
    customerName: "สุพจน์ ศรีใจ",
    trip: "เชียงใหม่ ฟู้ดทัวร์หนึ่งวัน",
    people: 2,
    paymentStatus: "Paid",
    amount: 5200,
    bookingDate: "2024-01-15",
  },
  {
    id: 2,
    customerName: "กมลทิพย์ ทองดี",
    trip: "ทริปเดินป่าระยะไกลคลองยัน",
    people: 4,
    paymentStatus: "Pending",
    amount: 11800,
    bookingDate: "2024-01-14",
  },
  {
    id: 3,
    customerName: "ปิยวลี สิงหเดช",
    trip: "เดินป่าเขาใหญ่",
    people: 1,
    paymentStatus: "Paid",
    amount: 3400,
    bookingDate: "2024-01-13",
  },
  {
    id: 4,
    customerName: "วรัญญู มณีนิล",
    trip: "ทริปชุมชนเกาะยอ",
    people: 3,
    paymentStatus: "Paid",
    amount: 10200,
    bookingDate: "2024-01-12",
  },
];

const chatbotInsights = {
  totalConversations: 1247,
  commonQuestions: [
    { question: "แพ็กเกจทริปมีอะไรบ้าง?", count: 156 },
    { question: "ระดับความยากเป็นอย่างไร?", count: 134 },
    { question: "ควรเตรียมอะไรไปบ้าง?", count: 98 },
    { question: "นโยบายยกเลิกเป็นอย่างไร?", count: 87 },
    { question: "มีอุปกรณ์ให้ยืมหรือไม่?", count: 76 },
  ],
  satisfaction: 4.3,
};

const PAYMENT_STATUS_LABEL: Record<RecentBooking["paymentStatus"], string> = {
  Paid: "ชำระแล้ว",
  Pending: "รอดำเนินการ",
  Due: "ค้างชำระ",
};

const ROOM_SERIES_LABEL: Record<"occupied" | "booked" | "available", string> = {
  occupied: "ผู้เดินทางจริง",
  booked: "จองยืนยัน",
  available: "ยกเลิก",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function EmployeeDashboard() {
  const [revenueRange, setRevenueRange] = useState<RangeKey>("weekly");
  const [guestRange, setGuestRange] = useState<RangeKey>("weekly");
  const [roomRange, setRoomRange] = useState<RangeKey>("weekly");
  const [bookings, setBookings] = useState<RecentBooking[]>(INITIAL_RECENT_BOOKINGS);
  const previousBookingsRef = useRef<RecentBooking[]>(INITIAL_RECENT_BOOKINGS);
  const suppressNotificationRef = useRef(false);

  const revenueData = REVENUE_SERIES[revenueRange];
  const guestsData = GUEST_SERIES[guestRange];
  const roomsData = ROOM_SERIES[roomRange];
  const openTripRatio = 83;
  const totalTripsCount = 6;

  useEffect(() => {
    const handleBookingCreated = (event: Event) => {
      const customEvent = event as CustomEvent<BookingCreatedPayload>;
      if (!customEvent.detail) {
        return;
      }

      const detail = customEvent.detail;
      const numericId =
        typeof detail.id === "number"
          ? detail.id
          : Number.parseInt(detail.id, 10) || Date.now();

      suppressNotificationRef.current = true;

      setBookings((prev) => {
        if (prev.some((booking) => booking.id === numericId)) {
          return prev;
        }

        const nextBooking: RecentBooking = {
          id: numericId,
          customerName: detail.customerName,
          trip: detail.trip,
          people: detail.people,
          paymentStatus: detail.paymentStatus ?? "Pending",
          amount: detail.amount,
          bookingDate: detail.bookingDate,
        };

        const maxItems = Math.max(prev.length, INITIAL_RECENT_BOOKINGS.length);
        return [nextBooking, ...prev].slice(0, maxItems);
      });
    };

    window.addEventListener(BOOKING_CREATED_EVENT, handleBookingCreated as EventListener);

    return () => {
      window.removeEventListener(BOOKING_CREATED_EVENT, handleBookingCreated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (suppressNotificationRef.current) {
      suppressNotificationRef.current = false;
    } else {
      const previousIds = new Set(previousBookingsRef.current.map((booking) => booking.id));
      const newEntries = bookings.filter((booking) => !previousIds.has(booking.id));
      if (newEntries.length > 0) {
        newEntries.forEach((booking) => {
          emitNotification({
            type: "booking",
            title: "การจองใหม่",
            message: `มีลูกค้าจองทริปใหม่: ${booking.customerName} - ${booking.trip}`,
            createdAt: booking.bookingDate,
          });
        });
      }
    }

    previousBookingsRef.current = bookings;
  }, [bookings]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
      </header>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <Card>
          <CardContent className="flex items-center p-4">
            <div className="mr-4 rounded-full bg-blue-50 p-3">
              <MapPin className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">ทริปที่เปิดให้จอง</p>
              <div className="flex items-center">
                <h3 className="mr-2 text-2xl font-bold">24</h3>
              </div>

              <div className="mt-1 flex items-center text-xs">
                <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                <span className="font-semibold text-green-600">8%</span>
                <span className="ml-1 text-gray-500">เดือนนี้</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="mr-4 rounded-full bg-green-50 p-3">
              <Users className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">ยอดการจองรวม</p>
              <div className="flex items-center">
                <h3 className="mr-2 text-2xl font-bold">342</h3>
              </div>
              <div className="mt-1 flex items-center text-xs">
                <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                <span className="font-semibold text-green-600">15%</span>
                <span className="ml-1 text-gray-500">เดือนนี้</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="mr-4 rounded-full bg-amber-50 p-3">
              <DollarSign className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">รายได้รวม</p>
              <div className="flex items-center">
                <h3 className="mr-2 text-2xl font-bold">฿185,000</h3>
              </div>
              <div className="mt-1 flex items-center text-xs">
                <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                <span className="font-semibold text-green-600">22%</span>
                <span className="ml-1 text-gray-500">เดือนนี้</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <Star className="h-5 w-5 text-yellow-500" fill="currentColor" strokeWidth={0} />
              <span>ทริปยอดจองสูงสุด</span>
            </div>
            <h4 className="mb-1 text-sm font-semibold">ทริปเดินป่าระยะไกลคลองยัน</h4>
            <p className="text-xs text-gray-500">45 การจองในเดือนนี้</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <CardTitle className="text-base font-semibold">รายได้</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex h-8 items-center gap-1 text-xs"
                >
                  <span>{RANGE_LABEL[revenueRange]}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setRevenueRange("weekly")}>รายสัปดาห์</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRevenueRange("monthly")}>รายเดือน</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRevenueRange("yearly")}>รายปี</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={revenueData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    padding={{ left: 10, right: 10 }}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const entry = payload[0];
                        const amount = Number(entry?.value ?? 0) * 1000;
                        const value = amount.toLocaleString("th-TH");
                        const label = String(entry?.payload?.name ?? "");
                        return (
                          <div className="rounded border bg-white p-2 text-xs shadow-sm">
                            <p className="font-medium text-gray-700">{label}</p>
                            <p>{`฿${value}`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <CardTitle className="text-base font-semibold">จำนวนผู้เข้าร่วม</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex h-8 items-center gap-1 text-xs"
                >
                  <span>{RANGE_LABEL[guestRange]}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setGuestRange("weekly")}>รายสัปดาห์</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setGuestRange("monthly")}>รายเดือน</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setGuestRange("yearly")}>รายปี</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart
                  data={guestsData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    padding={{ left: 10, right: 10 }}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const entry = payload[0];
                        const value = Number(entry?.value ?? 0).toLocaleString("th-TH");
                        const label = String(entry?.payload?.name ?? "");
                        return (
                          <div className="rounded border bg-white p-2 text-xs shadow-sm">
                            <p className="font-medium text-gray-700">{label}</p>
                            <p>{`${value} คน`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 5, fill: "white", stroke: "#3b82f6", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div>
              <CardTitle className="text-base font-semibold">สถานะการจองทริป</CardTitle>
              <div className="mt-1 text-xs text-gray-500">
 
                <div className="mt-1 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-xs">ผู้เดินทางจริง</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs">จองยืนยัน</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-xs">ยกเลิก</span>
                  </span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex h-8 items-center gap-1 text-xs"
                >
                  <span>{RANGE_LABEL[roomRange]}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setRoomRange("weekly")}>รายสัปดาห์</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRoomRange("monthly")}>รายเดือน</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRoomRange("yearly")}>รายปี</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={roomsData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    padding={{ left: 10, right: 10 }}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const monthLabel = String(payload[0]?.payload?.name ?? "");
                        return (
                          <div className="rounded border bg-white p-2 text-xs shadow-sm">
                            <p className="mb-1 font-medium text-gray-700">{monthLabel}</p>
                            {payload.map((entry) => {
                              const key = entry.dataKey as keyof typeof ROOM_SERIES_LABEL;
                              const label = ROOM_SERIES_LABEL[key];
                              const formattedValue = Number(entry.value ?? 0).toLocaleString("th-TH");
                              const suffix = key === "occupied" ? " คน" : " รายการ";
                              return (
                                <p key={entry.dataKey} style={{ color: entry.color }}>
                                  {`${label} ${formattedValue}${suffix}`}
                                </p>
                              );
                            })}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="occupied" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="booked" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="available" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex items-center justify-between gap-4 p-4 pb-0">
          <CardTitle className="text-base font-medium">รายการจองล่าสุด</CardTitle>
          <Button
            variant="outline"
            className="group flex items-center gap-1.5 rounded-full border-2 border-purple-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-purple-600 transition-colors hover:bg-purple-600 hover:text-white"
          >
            ดูทั้งหมด
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อลูกค้า</TableHead>
                  <TableHead>ชื่อทริป</TableHead>
                  <TableHead>จำนวนผู้เดินทาง</TableHead>
                  <TableHead>วันที่จอง</TableHead>
                  <TableHead>สถานะการชำระเงิน</TableHead>
                  <TableHead>ยอดชำระ</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{booking.customerName}</p>
                    </TableCell>
                    <TableCell className="text-sm">{booking.trip}</TableCell>
                    <TableCell className="text-sm">{booking.people} คน</TableCell>
                    <TableCell className="text-sm">{formatDate(booking.bookingDate)}</TableCell>
                    <TableCell>
                      <Badge
                        className={`px-2.5 py-0.5 text-xs font-medium ${
                          booking.paymentStatus === "Paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {PAYMENT_STATUS_LABEL[booking.paymentStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ฿{booking.amount.toLocaleString("th-TH")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="xs"
                        className="rounded-md border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        ดูรายละเอียด
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="pt-0" />
      </Card>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-base font-medium">5 ทริปยอดนิยม</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {topTrips.map((trip, index) => (
              <div
                key={trip.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div className="flex items-center">
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">{trip.name}</h4>
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="mr-1 h-3 w-3" />
                      {trip.bookings} การจอง
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    ฿{trip.revenue.toLocaleString("th-TH")}
                  </p>
                  <p className="text-xs text-gray-500">รายได้</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 p-4 pb-0 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center text-base font-medium">
              <MessageSquare className="mr-2 h-4 w-4" />
              AI Insight
            </CardTitle>
            <Button
              size="sm"
              className="flex items-center gap-2 rounded-full bg-blue-700 px-4 py-2 text-white shadow-sm transition hover:bg-blue-800"
            >
              <Link to="/summary" className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                สร้างสรุปผล
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
              <div>
                <p className="text-sm text-gray-600">จำนวนบทสนทนาทั้งหมด</p>
                <p className="text-2xl font-bold text-blue-600">
                  {chatbotInsights.totalConversations}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium">คำถามที่พบบ่อย</h4>
              <div className="space-y-2">
                {chatbotInsights.commonQuestions.slice(0, 3).map((question) => (
                  <div key={question.question} className="flex justify-between text-xs">
                    <span className="mr-2 flex items-center gap-2 truncate text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      {question.question}
                    </span>
                    <span className="font-medium">{question.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="rounded-xl border border-slate-200 px-4 py-3 text-slate-600">
                <p className="text-xs uppercase tracking-wide text-slate-400">คะแนนความพึงพอใจ (CSAT)</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {chatbotInsights.satisfaction}/5
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
