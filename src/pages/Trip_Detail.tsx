import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, UserCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TripRecord } from "./Trips";
import { TripStatus } from "./Trips";
import { GetTripById } from "@/api/trip";

type TripCustomer = {
  id: string;
  name: string;
  people: number;
  phone?: string;
  lineId?: string;
  amount?: number;
  note?: string;
};

const STATUS_BADGE: Record<
  TripStatus,
  { label: string; className: string; description: string }
> = {
  published: {
    label: "เปิดขาย",
    className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    description: "ทริปเปิดขายอยู่ในระบบ",
  },
  full: {
    label: "เต็มแล้ว",
    className: "bg-amber-100 text-amber-700 border border-amber-200",
    description: "ที่นั่งทั้งหมดถูกจองครบแล้ว",
  },
  draft: {
    label: "ร่าง",
    className: "border-slate-200 bg-slate-100 text-slate-600",
    description: "ยังไม่เปิดขาย ต้องกรอกข้อมูลเพิ่มเติม",
  },
  maintenance: {
    label: "ปิดปรับปรุง",
    className: "border-rose-200 bg-rose-100 text-rose-700",
    description: "กำลังตรวจสอบเส้นทางและทีมไกด์",
  },
};

const CUSTOMER_BOOKINGS: Record<string, TripCustomer[]> = {};

const TripDetail = () => {
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId: string }>();

  const [trip, setTrip] = useState<TripRecord | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<TripCustomer[]>([]);

  // Fetch trip data
  useEffect(() => {
    async function fetchTrip() {
      if (!tripId) return;
      setLoading(true);
      try {
        const t = await GetTripById(tripId);
        if (t) {
          // Map API Trip to TripRecord
          const start = t.start_date ? new Date(t.start_date) : new Date();
          const end = t.end_date ? new Date(t.end_date) : new Date();

          let diffDays = 1;
          if (t.start_date && t.end_date) {
            const diffTime = Math.abs(end.getTime() - start.getTime());
            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
          }

          let status: TripStatus = 'published';
          const now = new Date();
          if (start < now) status = 'full';
          if (t.capacity <= 0) status = 'full';

          const regionMap: Record<string, string> = {
            north: "ภาคเหนือ",
            central: "ภาคกลาง",
            northeast: "ภาคอีสาน",
            west: "ภาคตะวันตก",
            east: "ภาคตะวันออก",
            south: "ภาคใต้",
          };

          const mappedTrip: TripRecord = {
            id: String(t.id),
            name: t.name || "Unknown Trip",
            destination: t.province || "Unknown",
            region: regionMap[t.location] || t.location || "Central",
            category: t.category_label || t.category || "General",
            difficulty: "ปานกลาง",
            tripType: "ทริปวันเดียว",
            startDate: start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
            startDateISO: t.start_date || new Date().toISOString(),
            duration: `${diffDays} วัน`,
            price: parseFloat(t.price_per_person || "0"),
            seats: t.capacity || 0,
            booked: 0,
            status: status,
            rating: 5.0,
            guide: t.created_by_name || "Unknown",
            lastUpdated: t.created_at ? new Date(t.created_at).toLocaleDateString('th-TH') : "-",
            tags: [],
            imageUrl: t.thumbnail_image || "",
          };
          setTrip(mappedTrip);

          setCustomers(CUSTOMER_BOOKINGS[String(t.id)] || []);
        }
      } catch (error) {
        console.error("Failed to fetch trip", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrip();
  }, [tripId]);

  const [departureDate, setDepartureDate] = useState("");
  const [selectedGuide, setSelectedGuide] = useState("");

  useEffect(() => {
    if (trip) {
      setDepartureDate(trip.startDateISO);
      setSelectedGuide(trip.guide);
    }
  }, [trip]);

  const guideOptions = useMemo(() => {
    if (!trip) return [];
    return [trip.guide];
  }, [trip]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">กำลังโหลดข้อมูล...</div>;
  }

  if (!trip) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="size-4" />
          กลับ
        </Button>
        <Card>
          <CardHeader className="px-6 pb-3">
            <CardTitle>ไม่พบข้อมูลทริป</CardTitle>
            <CardDescription>กรุณาเลือกทริปจากรายการอีกครั้ง</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const statusMeta = STATUS_BADGE[trip.status] || STATUS_BADGE.published;

  const totalBookings = customers.length;

  const handleCustomerCountChange = (customerId: string, value: number) => {
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === customerId
          ? { ...customer, people: Number.isNaN(value) ? 0 : Math.max(0, value) }
          : customer,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
            กลับไปหน้าทริป
          </Button>
          <Badge className={cn("rounded-full px-3 py-1 text-xs", statusMeta.className)}>
            {statusMeta.label}
          </Badge>
        </div>
        <div>
          <Button className="min-w-[120px]">บันทึก</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="px-6 pb-3">
          <CardTitle className="text-xl font-semibold mt-2">{trip.name}</CardTitle>
          <CardDescription className="flex flex-col gap-2 text-slate-600 sm:flex-row sm:items-center sm:gap-4">
            <span className="flex items-center gap-2">
              <MapPin className="size-4 text-slate-400" />
              {trip.destination}
            </span>
            <span className="flex items-center gap-2">
              <Users className="size-4 text-slate-400" />
              รองรับ {trip.seats} ที่นั่ง •
              <span className="inline-flex items-center gap-1 text-slate-700">
                <UserCheck className="size-4 text-slate-400" />
                จองแล้ว {totalBookings} คน
              </span>
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 px-6 pb-6">
          <div className="space-y-2">
            <p className="text-xs uppercase text-slate-500">วันที่ออกเดินทาง</p>
            <Input
              type="date"
              value={departureDate}
              onChange={(event) => setDepartureDate(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs uppercase text-slate-500">ระยะเวลาเดินทาง</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 py-2 text-sm font-medium text-slate-700">
              {trip.duration || "-"}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase text-slate-500">ไกด์ประจำทริป</p>
            <Select value={selectedGuide} onValueChange={setSelectedGuide}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกชื่อไกด์" />
              </SelectTrigger>
              <SelectContent>
                {guideOptions.map((guide) => (
                  <SelectItem key={guide} value={guide}>
                    {guide}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs uppercase text-slate-500">ยอดจองรวม</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              {totalBookings} คน
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg py-2">รายชื่อลูกค้าที่จอง</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                  ลูกค้า
                </TableHead>
                <TableHead className="px-6 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                  เบอร์โทร
                </TableHead>
                <TableHead className="px-6 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                  Line ID
                </TableHead>
                <TableHead className="px-6 text-center text-sm font-semibold uppercase tracking-wide text-slate-600">
                  จำนวนผู้ร่วมเดินทาง
                </TableHead>
                <TableHead className="px-6 text-right text-sm font-semibold uppercase tracking-wide text-slate-600">
                  ยอดชำระ
                </TableHead>
                <TableHead className="px-6 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                  หมายเหตุ
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                      {customer.name}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-left text-sm text-slate-600">
                      {customer.phone ?? "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-left text-sm text-slate-600">
                      {customer.lineId ?? "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <Input
                        type="number"
                        min={0}
                        value={customer.people}
                        onChange={(event) =>
                          handleCustomerCountChange(
                            customer.id,
                            Number.parseInt(event.target.value, 10),
                          )
                        }
                        className="mx-auto w-24 text-center"
                      />
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                      {customer.amount ? `฿${customer.amount.toLocaleString("th-TH")}` : "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-left text-sm text-slate-600">
                      {customer.note ?? "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                    ยังไม่มีลูกค้าจองทริปนี้
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
};

export default TripDetail;
