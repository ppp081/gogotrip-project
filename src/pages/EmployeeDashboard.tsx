// src/pages/EmployeeDashboard.tsx
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  DollarSign,
  Loader2,
  MapPin,
  MessageSquare,
  Sparkles,
  Star,
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
import { apiFetch } from "@/api/client";

type RangeKey = "monthly" | "yearly";

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

interface TopTrip {
  id: string;
  name: string;
  bookings: number;
  travelers: number;
  revenue: number;
  image: string | null;
}

interface RecentBooking {
  id: number | string;
  customerName: string;
  trip: string;
  people: number;
  paymentStatus: "Paid" | "Pending" | "Due";
  amount: number;
  bookingDate: string;
}

type DashboardData = {
  activeTripsCount: number;
  totalBookingsCount: number;
  totalRevenue: number;
  topTrips: TopTrip[];
  recentBookings: RecentBooking[];
  chatbotInsights: {
    totalConversations: number;
    commonQuestions: { question: string; count: number }[];
    satisfaction: number;
  };
  revenueSeries: Record<RangeKey, RevenueDatum[]>;
  guestSeries: Record<RangeKey, RevenueDatum[]>;
  roomSeries: Record<RangeKey, RoomDatum[]>;
};

const RANGE_LABEL: Record<RangeKey, string> = {
  monthly: "รายเดือน",
  yearly: "รายปี",
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
  const [revenueRange, setRevenueRange] = useState<RangeKey>("monthly");
  const [guestRange, setGuestRange] = useState<RangeKey>("monthly");
  const [roomRange, setRoomRange] = useState<RangeKey>("monthly");
  const [topTripsSort, setTopTripsSort] = useState<"bookings" | "revenue">("revenue");
  const [bookings, setBookings] = useState<RecentBooking[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const previousBookingsRef = useRef<RecentBooking[]>([]);
  const suppressNotificationRef = useRef(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiFetch("/dashboard/");
        if (res.ok) {
          const data = (await res.json()) as DashboardData;
          setDashboardData(data);
          setBookings(data.recentBookings);
          previousBookingsRef.current = data.recentBookings;
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

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

        const maxItems = Math.max(prev.length, 10);
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

  if (isLoading || !dashboardData) {
    return (
      <div className="flex min-h-[400px] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <div className="text-lg font-medium text-slate-500 animate-pulse">กำลังโหลดข้อมูลแดชบอร์ด...</div>
      </div>
    );
  }

  const revenueData = dashboardData.revenueSeries[revenueRange];
  const guestsData = dashboardData.guestSeries[guestRange];
  const roomsData = dashboardData.roomSeries[roomRange];
  const activeTripsCount = dashboardData.activeTripsCount;
  const totalBookingsCount = dashboardData.totalBookingsCount;
  const totalRevenue = dashboardData.totalRevenue;
  const topTrips = dashboardData.topTrips;
  const chatbotInsights = dashboardData.chatbotInsights;

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
                <h3 className="mr-2 text-2xl font-bold">{activeTripsCount}</h3>
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
                <h3 className="mr-2 text-2xl font-bold">{totalBookingsCount}</h3>
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
                <h3 className="mr-2 text-2xl font-bold">฿{totalRevenue.toLocaleString("th-TH")}</h3>
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
            <h4 className="mb-1 text-sm font-semibold truncate overflow-hidden whitespace-nowrap">{topTrips.length > 0 ? topTrips[0].name : "ไม่มีข้อมูล"}</h4>
            <p className="text-xs text-gray-500">{topTrips.length > 0 ? `${topTrips[0].bookings} การจอง` : "-"}</p>
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
                        const value = Number(entry?.value ?? 0).toLocaleString("th-TH");
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
                        className={`px-2.5 py-0.5 text-xs font-medium ${booking.paymentStatus === "Paid"
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
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <CardTitle className="text-base font-semibold">ทริปยอดนิยม</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                  <span>เรียงตาม{topTripsSort === "revenue" ? "รายได้" : "การจอง"}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setTopTripsSort("revenue")}>รายได้</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setTopTripsSort("bookings")}>จำนวนยอดจอง</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {[...topTrips]
              .sort((a, b) => (topTripsSort === "revenue" ? b.revenue - a.revenue : b.bookings - a.bookings))
              .slice(0, 5)
              .map((trip, index) => (
                <div
                  key={trip.id}
                  className="group flex items-center justify-between rounded-xl border border-transparent p-2 transition-all hover:bg-slate-50 hover:border-slate-100"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                      {trip.image ? (
                        <img src={trip.image} alt={trip.name} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <MapPin className="h-5 w-5" />
                        </div>
                      )}
                      <div className="absolute left-0 top-0 flex h-4 w-4 items-center justify-center rounded-br-lg bg-blue-600 text-[10px] font-bold text-white shadow-sm">
                        {index + 1}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold text-slate-800" title={trip.name}>{trip.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Users className="h-3 w-3" />
                        <span>{trip.bookings} การจอง</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      ฿{trip.revenue.toLocaleString("th-TH")}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500">
                      {trip.travelers.toLocaleString("th-TH")} คน
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">รายได้</p>
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
