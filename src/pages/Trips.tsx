import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Eye,
  EyeOff,
  MapPin,
  Search,
  UserCircle2,
  UserCheck,
  Users,
  Wallet,
  SquarePen
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GetTripsList } from "@/api/trip";

export type TripStatus = "published" | "draft" | "full" | "maintenance";

export type TripRecord = {
  id: string;
  name: string;
  destination: string;
  region: string;
  category: string;
  difficulty: "ง่าย" | "ปานกลาง" | "ท้าทาย";
  tripType: "ทริปวันเดียว" | "ทริปเดินป่า" | "ทริปคาเฟ่" | "ทริปวัฒนธรรม";
  startDate: string;
  startDateISO: string;
  duration: string;
  price: number;
  seats: number;
  booked: number;
  status: TripStatus;
  rating: number;
  guide: string;
  lastUpdated: string;
  tags: string[];
  imageUrl: string;
};

// Keeping for reference/fallback
/*
export const TRIP_DATA: TripRecord[] = [
  ...
];
*/

const TRIP_IMAGES_BY_TYPE: Record<string, string> = {
  "ทริปวันเดียว":
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=600&q=80",
  "ทริปเดินป่า":
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80",
  "ทริปคาเฟ่":
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
  "ทริปวัฒนธรรม":
    "https://images.unsplash.com/photo-1524492412937-4961f00c1ac2?auto=format&fit=crop&w=600&q=80",
};

const STATUS_META: Record<
  TripStatus,
  { label: string; className: string; description: string }
> = {
  published: {
    label: "เปิดขาย",
    className: "border-emerald-200 bg-emerald-100 text-emerald-700",
    description: "ทริปพร้อมขายและเปิดรับลูกค้าอยู่",
  },
  draft: {
    label: "ร่าง",
    className: "border-slate-200 bg-slate-100 text-slate-600",
    description: "ยังไม่เปิดขาย ต้องกรอกข้อมูลเพิ่มเติม",
  },
  full: {
    label: "เต็มแล้ว",
    className: "border-amber-200 bg-amber-100 text-amber-700",
    description: "ที่นั่งเต็มแล้ว รอลูกค้ายกเลิกหรือเพิ่มรอบ",
  },
  maintenance: {
    label: "ปิดปรับปรุง",
    className: "border-rose-200 bg-rose-100 text-rose-700",
    description: "กำลังตรวจสอบเส้นทางและทีมไกด์",
  },
};

const STATUS_FILTER_OPTIONS: { value: TripStatus | "all"; label: string }[] = [
  { value: "all", label: "สถานะทั้งหมด" },
  { value: "published", label: "เปิดจอง" },
  { value: "full", label: "เต็มแล้ว" },
  { value: "full", label: "สิ้นสุดแล้ว" },
];

const CATEGORIES = [
  "ทริปมาแรง",
  "ทริปตามรอย Youtuber",
  "ทริปเชิงวัฒนธรรม",
  "ทริปเดินป่า",
  "ทริปเที่ยววันเดียว",
];

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const Trips = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TripStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTrips() {
      try {
        setLoading(true);
        console.log("Fetching trips...");
        const data = await GetTripsList();
        console.log("Trips data received:", data);

        if (!data || !Array.isArray(data)) {
          console.error("Invalid trips data received:", data);
          setTrips([]);
          return;
        }

        const mappedTrips: TripRecord[] = data.map((t) => {
          const start = t.start_date ? new Date(t.start_date) : new Date();
          const end = t.end_date ? new Date(t.end_date) : new Date();

          let diffDays = 1;
          if (t.start_date && t.end_date) {
            const diffTime = Math.abs(end.getTime() - start.getTime());
            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
          }

          let status: TripStatus = 'published';
          const now = new Date();
          if (start < now) status = 'full'; // Past trips
          if (t.capacity <= 0) status = 'full';

          // Map regions
          const regionMap: Record<string, string> = {
            north: "ภาคเหนือ",
            central: "ภาคกลาง",
            northeast: "ภาคอีสาน",
            west: "ภาคตะวันตก",
            east: "ภาคตะวันออก",
            south: "ภาคใต้",
          };

          return {
            id: String(t.id),
            name: t.name || "Unknown Trip",
            destination: t.province || "Unknown",
            region: regionMap[t.location] || t.location || "Central",
            category: t.category_label || t.category || "General",
            difficulty: "ปานกลาง", // Default
            tripType: "ทริปวันเดียว", // Default or derive from category
            startDate: start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
            startDateISO: t.start_date || new Date().toISOString(),
            duration: `${diffDays} วัน`,
            price: parseFloat(t.price_per_person || "0"),
            seats: t.capacity || 0,
            booked: 0, // Mock for now as API doesn't return booked count yet
            status: status,
            rating: 5.0,
            guide: t.created_by_name || "Unknown",
            lastUpdated: t.created_at ? new Date(t.created_at).toLocaleDateString('th-TH') : "-",
            tags: [],
            imageUrl: t.thumbnail_image || "",
          };
        });
        setTrips(mappedTrips);
      } catch (err) {
        console.error("Failed to fetch trips", err);
        setTrips([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTrips();
  }, []);

  const totals = useMemo(() => {
    return trips.reduce(
      (acc, trip) => {
        acc.totalSeats += trip.seats;
        acc.totalBooked += trip.booked;
        acc.forecastRevenue += trip.booked * trip.price;
        if (trip.status === "published") {
          acc.openTrips += 1;
        }
        if (trip.status === "full") {
          acc.fullyBooked += 1;
        }
        return acc;
      },
      {
        totalSeats: 0,
        totalBooked: 0,
        forecastRevenue: 0,
        openTrips: 0,
        fullyBooked: 0,
      }
    );
  }, [trips]);

  const averageOccupancy =
    totals.totalSeats > 0
      ? Math.round((totals.totalBooked / totals.totalSeats) * 100)
      : 0;

  const openTripRatio =
    trips.length > 0 ? Math.round((totals.openTrips / trips.length) * 100) : 0;

  const highDemandTrips = trips.filter(
    (trip) =>
      trip.status === "published" &&
      trip.seats > 0 &&
      trip.booked / trip.seats >= 0.8,
  ).length;

  const fullyBookedBadgeLabel =
    highDemandTrips > 0 ? `${highDemandTrips} ทริปใกล้เต็ม` : "ยังไม่มีทริปใกล้เต็ม";

  const nextDeparture = useMemo(() => {
    return [...trips]
      .filter((trip) => trip.status !== "maintenance")
      .sort(
        (a, b) =>
          new Date(a.startDateISO).getTime() - new Date(b.startDateISO).getTime(),
      )[0];
  }, [trips]);

  const attentionTrips = useMemo(() => {
    return trips.filter(
      (trip) => trip.status === "draft" || trip.status === "maintenance",
    );
  }, [trips]);

  const filteredTrips = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return trips.filter((trip) => {
      const matchesSearch =
        term.length === 0 ||
        [trip.name, trip.destination, trip.region, trip.guide]
          .join(" ")
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        statusFilter === "all" || trip.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || trip.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [searchTerm, statusFilter, categoryFilter, trips]);

  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>({});

  // Initialize visibility map when trips change
  useEffect(() => {
    if (trips.length > 0) {
      setVisibilityMap((prev) => {
        const newMap = { ...prev };
        trips.forEach((t) => {
          if (newMap[t.id] === undefined) newMap[t.id] = true;
        });
        return newMap;
      });
    }
  }, [trips]);

  const onToggleVisible = (tripId: string) => {
    setVisibilityMap((previous) => ({
      ...previous,
      [tripId]: !previous[tripId],
    }));
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900">จัดการทริป</h1>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-4 sm:p-5">
            <div className="rounded-full bg-sky-50 p-3">
              <MapPin className="h-6 w-6 text-sky-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-500">ทริปที่เปิดขาย</p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-semibold text-slate-900">{totals.openTrips}</h3>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-600">
                  {openTripRatio}%
                </span>
              </div>
              <p className="text-xs text-slate-500">จากทั้งหมด {trips.length} รายการ</p>

            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4 sm:p-5">
            <div className="rounded-full bg-emerald-50 p-3">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-500">อัตราการจองเฉลี่ย</p>
              <div className="flex items-baseline">
                <h3 className="text-2xl font-semibold text-slate-900">
                  {averageOccupancy}%
                </h3>
              </div>
              <div className="text-xs text-slate-500">
                จองแล้ว {totals.totalBooked} / {totals.totalSeats} ที่นั่ง
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4 sm:p-5">
            <div className="rounded-full bg-amber-50 p-3">
              <Wallet className="h-6 w-6 text-amber-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-500">รายได้ทั้งหมด</p>
              <div className="flex items-baseline gap-2 flex-col">
                <h3 className="text-2xl font-semibold text-slate-900">
                  {currencyFormatter.format(totals.forecastRevenue)}
                </h3>
              </div>
              <div className="text-xs text-slate-500">รวมยอดจองที่ยืนยันแล้ว</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4 sm:p-5">
            <div className="rounded-full bg-purple-50 p-3">
              <UserCheck className="h-6 w-6 text-purple-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-500">ทริปที่เต็มแล้ว</p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-semibold text-slate-900">{totals.fullyBooked}</h3>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600">
                  {fullyBookedBadgeLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500">จากทั้งหมด {trips.length} รายการ</p>

            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="lg:col-span-1 py-5">
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">รายการทริป</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="ค้นหาทริป ชื่อไกด์ หรือปลายทาง..."
                  className="pl-9"
                  aria-label="ค้นหาทริป"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as TripStatus | "all")
                  }
                >
                  <SelectTrigger className="w-[160px]" aria-label="กรองสถานะ">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={categoryFilter}
                  onValueChange={(value) => setCategoryFilter(value)}
                >
                  <SelectTrigger className="w-[150px]" aria-label="กรองประเภททริป">
                    <SelectValue placeholder="ทุกประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกประเภท</SelectItem>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <Table className="w-full table-auto">
                <TableHeader className="">
                  <TableRow>
                    <TableHead>ทริป</TableHead>
                    <TableHead>วันเดินทาง</TableHead>
                    <TableHead>ที่นั่งว่าง</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-sm text-slate-500">
                        กำลังโหลดข้อมูล...
                      </TableCell>
                    </TableRow>
                  ) : filteredTrips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-sm text-slate-500">
                        ไม่พบทริปที่ตรงกับเงื่อนไข ลองเปลี่ยนตัวกรองหรือรีเซ็ตการค้นหา
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTrips.map((trip) => {
                      const occupancy =
                        trip.seats > 0
                          ? Math.round((trip.booked / trip.seats) * 100)
                          : 0;
                      const availableSeats = Math.max(trip.seats - trip.booked, 0);
                      const imageSrc =
                        trip.imageUrl || TRIP_IMAGES_BY_TYPE[trip.tripType] || "";

                      return (
                        <TableRow key={trip.id} className="bg-white">
                          <TableCell className="align-top w-sm">
                            <div className="flex gap-4">
                              <div className="relative h-24 w-32 overflow-hidden rounded-lg">
                                <img
                                  src={imageSrc}
                                  alt={trip.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                                  {trip.category}
                                </span>
                              </div>
                              <div className="flex flex-1 flex-col justify-between space-y-1.5">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {trip.name}
                                  </p>
                                  <p className="flex items-center gap-1 text-xs text-slate-500">
                                    <MapPin className="size-3.5 text-slate-400" />
                                    <span>{trip.destination}</span>
                                  </p>
                                </div>
                                <div className="text-xs text-slate-500">
                                  <span className="font-medium text-slate-700">
                                    {currencyFormatter.format(trip.price)}
                                  </span>{" "}
                                  / คน • {trip.tripType}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="align-top text-sm text-slate-600">
                            <div className="space-y-1">
                              <span className="font-semibold text-slate-900">
                                {trip.startDate}
                              </span>
                              <p className="text-xs text-slate-500">
                                ระยะเวลา {trip.duration}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className="align-top text-sm text-slate-600">
                            <div className="space-y-1">
                              <span className="font-semibold text-slate-900">
                                เหลือ {availableSeats} ที่นั่ง
                              </span>
                              <p className="text-xs text-slate-500">
                                จองแล้ว {trip.booked}/{trip.seats} • {occupancy}%
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className="align-top w-40">
                            <div className="space-y-1">
                              <Badge
                                className={cn(
                                  "border text-xs",
                                  STATUS_META[trip.status].className,
                                )}
                              >
                                {STATUS_META[trip.status].label}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="align-top text-center w-40">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  event.currentTarget.animate(
                                    [
                                      { transform: "scale(1)", opacity: 1 },
                                      { transform: "scale(0.9)", opacity: 0.85 },
                                      { transform: "scale(1)", opacity: 1 },
                                    ],
                                    {
                                      duration: 180,
                                      easing: "ease-out",
                                    },
                                  );
                                  onToggleVisible(trip.id);
                                }}
                                aria-label={
                                  (visibilityMap[trip.id] ?? true)
                                    ? `ซ่อนทริป ${trip.name}`
                                    : `แสดงทริป ${trip.name}`
                                }
                                title={
                                  (visibilityMap[trip.id] ?? true)
                                    ? "ซ่อนทริปนี้"
                                    : "แสดงทริปนี้"
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:shadow-sm"
                              >
                                {visibilityMap[trip.id] ?? true ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-slate-400" />
                                )}
                              </button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-none rounded-full shadow-none hover:bg-slate-100 hover:shadow-sm p-2"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  navigate(`/trips/${trip.id}`);
                                }}
                              >
                                <SquarePen
                                />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {nextDeparture ? (
            <Card>
              <CardHeader className="gap-1.5">
                <CardTitle className="text-base pt-5">กำหนดการเดินทางถัดไป</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {nextDeparture.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="size-3.5 text-slate-400" />
                        <span>{nextDeparture.destination}</span>
                      </div>
                    </div>
                    <Badge className="border-blue-200 bg-blue-100 text-blue-700">
                      {nextDeparture.startDate}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-600 space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-4 text-slate-400" />
                      <span>{nextDeparture.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-slate-400" />
                      <span>
                        จองแล้ว {nextDeparture.booked}/{nextDeparture.seats} ที่นั่ง
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <UserCircle2 className="size-4 text-slate-400" />
                      <span>ไกด์ {nextDeparture.guide}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {attentionTrips.length > 0 ? (
            <Card>
              <CardHeader className="gap-2">
                <CardTitle className="text-base">รายการที่ต้องติดตาม</CardTitle>
                <CardDescription>
                  จัดลำดับการเตรียมเอกสารหรืออัปเดตข้อมูลให้ลูกค้าทราบ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                <div className="space-y-3">
                  {attentionTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="rounded-lg border border-slate-200 p-4 hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {trip.name}
                          </p>
                          <p className="text-xs text-slate-500">{trip.destination}</p>
                        </div>
                        <Badge
                          className={cn(
                            "border text-xs",
                            STATUS_META[trip.status].className,
                          )}
                        >
                          {STATUS_META[trip.status].label}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {STATUS_META[trip.status].description}
                      </p>
                      <div className="mt-3 flex items-center justify-end text-xs text-slate-400">
                        <Button variant="link" size="xs" className="px-0 text-xs">
                          จัดการทริป
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Trips;
