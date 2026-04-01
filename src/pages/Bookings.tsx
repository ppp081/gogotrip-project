import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Filter,
  Loader2,
  Search,
  ShoppingBag,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  currencyFormatter,
} from "./bookings-data";
import {
  GetAllBookingEquipments,
  GetAllBookings,
  GetAllPayments,
  type Booking,
  type BookingEquipment,
  type Payment,
  type PaymentStatus,
} from "@/api/booking";
import { GetTripsList, type Trip } from "@/api/trip";

type BookingTab = "all" | "by-trip";

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "รอชำระ",
  slip_uploaded: "อัปโหลดสลิปแล้ว",
  verifying: "กำลังตรวจสอบ",
  paid: "ชำระแล้ว",
  failed: "ชำระไม่สำเร็จ",
  refunded: "คืนเงินแล้ว",
};

const PAYMENT_STATUS_BADGE: Record<PaymentStatus, string> = {
  pending: "bg-slate-100 text-slate-700 border border-slate-200",
  slip_uploaded: "bg-amber-100 text-amber-700 border border-amber-200",
  verifying: "bg-blue-100 text-blue-700 border border-blue-200",
  paid: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  failed: "bg-rose-100 text-rose-700 border border-rose-200",
  refunded: "bg-purple-100 text-purple-700 border border-purple-200",
};

const PAYMENT_STATUS_OPTIONS: Array<{ value: PaymentStatus | "all"; label: string }> = [
  { value: "all", label: "สถานะทั้งหมด" },
  { value: "pending", label: PAYMENT_STATUS_LABEL.pending },
  { value: "slip_uploaded", label: PAYMENT_STATUS_LABEL.slip_uploaded },
  { value: "verifying", label: PAYMENT_STATUS_LABEL.verifying },
  { value: "paid", label: PAYMENT_STATUS_LABEL.paid },
  { value: "failed", label: PAYMENT_STATUS_LABEL.failed },
  { value: "refunded", label: PAYMENT_STATUS_LABEL.refunded },
];

function formatThaiDateShort(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function derivePaymentStatus(bookingId: string, paymentsByBooking: Map<string, Payment[]>): PaymentStatus {
  const payments = paymentsByBooking.get(bookingId) ?? [];
  // priority: paid > verifying > slip_uploaded > failed > refunded > pending
  if (payments.some((p) => p.payment_status === "paid")) return "paid";
  if (payments.some((p) => p.payment_status === "verifying")) return "verifying";
  if (payments.some((p) => p.payment_status === "slip_uploaded")) return "slip_uploaded";
  if (payments.some((p) => p.payment_status === "failed")) return "failed";
  if (payments.some((p) => p.payment_status === "refunded")) return "refunded";
  return "pending";
}

function formatEquipments(bookingId: string, equipmentsByBooking: Map<string, BookingEquipment[]>): string {
  const items = equipmentsByBooking.get(bookingId) ?? [];
  if (items.length === 0) return "-";
  return items
    .map((i) => `${i.equipment_name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`)
    .join(", ");
}

const Bookings = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [activeTab, setActiveTab] = useState<BookingTab>("all");
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [paymentsByBooking, setPaymentsByBooking] = useState<Map<string, Payment[]>>(new Map());
  const [equipmentsByBooking, setEquipmentsByBooking] = useState<Map<string, BookingEquipment[]>>(new Map());
  const [tripsById, setTripsById] = useState<Map<string, Trip>>(new Map());

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [bookingsData, paymentsData, equipmentsData, tripsData] = await Promise.all([
          GetAllBookings(),
          GetAllPayments(),
          GetAllBookingEquipments(),
          GetTripsList(),
        ]);

        setBookings(bookingsData);

        const paymentsMap = new Map<string, Payment[]>();
        paymentsData.forEach((p) => {
          const key = String(p.booking);
          const arr = paymentsMap.get(key);
          if (arr) arr.push(p);
          else paymentsMap.set(key, [p]);
        });
        setPaymentsByBooking(paymentsMap);

        const equipmentsMap = new Map<string, BookingEquipment[]>();
        equipmentsData.forEach((e) => {
          const key = String(e.booking);
          const arr = equipmentsMap.get(key);
          if (arr) arr.push(e);
          else equipmentsMap.set(key, [e]);
        });
        setEquipmentsByBooking(equipmentsMap);

        const tripMap = new Map<string, Trip>();
        tripsData.forEach((t) => tripMap.set(String(t.id), t));
        setTripsById(tripMap);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const paymentStatus = derivePaymentStatus(String(booking.id), paymentsByBooking);
      const matchesSearch =
        term.length === 0 ||
        [
          booking.trip_name,
          booking.customer_name,
          booking.status,
          paymentStatus,
          formatEquipments(String(booking.id), equipmentsByBooking),
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        statusFilter === "all" || paymentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, equipmentsByBooking, paymentsByBooking, searchTerm, statusFilter]);

  const bookingsGroupedByTrip = useMemo(() => {
    const map = new Map<string, Booking[]>();
    filteredBookings.forEach((b) => {
      const key = String(b.trip);
      const arr = map.get(key);
      if (arr) arr.push(b);
      else map.set(key, [b]);
    });
    return [...map.entries()]
      .map(([tripId, items]) => ({
        tripId,
        trip: tripsById.get(tripId) ?? null,
        bookings: items,
        totalPeople: items.reduce((sum, i) => sum + (i.group_size || 0), 0),
      }))
      .sort((a, b) => b.bookings.length - a.bookings.length);
  }, [filteredBookings, tripsById]);

  function BookingsTable({ rows }: { rows: Booking[] }) {
    return (
      <Table>
        <colgroup>
          <col style={{ width: "320px" }} />
          <col style={{ width: "220px" }} />
          <col style={{ width: "220px" }} />
          <col style={{ width: "160px" }} />
          <col style={{ width: "140px" }} />
          <col style={{ width: "160px" }} />
          <col style={{ width: "180px" }} />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[320px] px-6 pb-2 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
              ทริป
            </TableHead>
            <TableHead className="w-[220px] px-6 pb-2 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
              ชื่อลูกค้า
            </TableHead>
            <TableHead className="w-[220px] px-6 pb-2 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
              อุปกรณ์เสริม
            </TableHead>
            <TableHead className="w-[160px] px-6 pb-2 text-right text-sm font-semibold uppercase tracking-wide text-slate-600">
              ยอดชำระ
            </TableHead>
            <TableHead className="w-[140px] px-6 pb-2 text-center text-sm font-semibold uppercase tracking-wide text-slate-600">
              จำนวนคน
            </TableHead>
            <TableHead className="w-[160px] px-6 pb-2 text-center text-sm font-semibold uppercase tracking-wide text-slate-600">
              วันที่จอง
            </TableHead>
            <TableHead className="w-[180px] px-6 pb-2 text-center text-sm font-semibold uppercase tracking-wide text-slate-600">
              สถานะการชำระเงิน
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((booking) => {
            const paymentStatus = derivePaymentStatus(String(booking.id), paymentsByBooking);
            const statusLabel = PAYMENT_STATUS_LABEL[paymentStatus];
            const statusClass = PAYMENT_STATUS_BADGE[paymentStatus];

            return (
              <TableRow
                key={booking.id}
                onClick={() => navigate(`/bookings/${booking.id}`)}
                className="cursor-pointer transition hover:bg-slate-50"
              >
                <TableCell className="px-6 py-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                      <ShoppingBag className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{booking.trip_name}</p>
                      <p className="text-xs text-slate-400">
                        {booking.status === "cancelled" ? "ยกเลิกแล้ว" : "การจอง"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-left text-sm text-slate-700">
                  {booking.customer_name}
                </TableCell>
                <TableCell className="px-6 py-4 text-left text-sm text-slate-600">
                  {formatEquipments(String(booking.id), equipmentsByBooking)}
                </TableCell>
                <TableCell className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                  {currencyFormatter.format(parseFloat(booking.total_price || "0"))}
                </TableCell>
                <TableCell className="px-6 py-4 text-center text-sm text-slate-600">
                  {booking.group_size} คน
                </TableCell>
                <TableCell className="px-6 py-4 text-center text-sm text-slate-600">
                  {formatThaiDateShort(booking.created_at)}
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  <Badge className={cn("rounded-full px-3 py-1 text-xs", statusClass)}>
                    {statusLabel}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900">รายการการจองของลูกค้า</h1>
      </header>
      <Card className="border-none bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="ค้นหารายการชำระ เช่น ชื่อผู้จอง "
              className="w-full pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 py-3 pr-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BookingTab)}>
              <TabsList className="bg-slate-100">
                <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
                <TabsTrigger value="by-trip">แยกตามทริป</TabsTrigger>
              </TabsList>
            </Tabs>
            {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="size-4" />
                    ตัวกรอง
                    <ChevronDown className="size-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuLabel>สถานะการชำระเงิน</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as PaymentStatus | "all")
                    }
                  >
                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                      <DropdownMenuRadioItem key={option.value} value={option.value}>
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu> */}
          </div>
        </CardHeader>
        <CardContent className="px-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" />
              กำลังโหลดข้อมูล...
            </div>
          ) : (
            <Tabs value={activeTab}>
              <TabsContent value="all">
                <BookingsTable rows={filteredBookings} />
              </TabsContent>
              <TabsContent value="by-trip">
                <div className="rounded-xl border border-slate-200 bg-white">
                  <Accordion type="single" collapsible className="w-full">
                    {bookingsGroupedByTrip.map((group) => (
                      <AccordionItem key={group.tripId} value={group.tripId}>
                        <AccordionTrigger className="px-6">
                          <div className="flex w-full flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="font-semibold text-slate-900">
                                {group.trip?.name || group.bookings[0]?.trip_name || "ทริป"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {group.trip?.province ? `${group.trip.province} • ` : ""}
                                {group.bookings.length} รายการ • {group.totalPeople} คน
                              </div>
                            </div>
                            <Badge className="w-fit rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              เปิดดูรายการ
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-2 pb-4">
                          <BookingsTable rows={group.bookings} />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                    {bookingsGroupedByTrip.length === 0 && (
                      <div className="px-6 py-10 text-center text-sm text-slate-500">
                        ยังไม่มีรายการจอง
                      </div>
                    )}
                  </Accordion>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        <CardContent className="flex flex-col items-start justify-between gap-4 border-t border-slate-100 px-4 py-4 text-sm text-slate-500 sm:flex-row sm:items-center">

          <Pagination className="sm:justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>
    </div>
  );
};

export default Bookings;
