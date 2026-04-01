import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import {
  ArrowLeft,
  Calendar,
  Eye,
  ImageIcon,
  Loader2,
  MapPin,
  Pencil,
  Save,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  GetTripById,
  UpdateTrip,
  GetBookingsByTrip,
  type Trip,
  type Booking,
} from "@/api/trip";
import { TripMarkdown } from "@/components/TripMarkdown";
import { DeleteBooking } from "@/api/booking";

const LOCATION_OPTIONS = [
  { value: "north", label: "ภาคเหนือ" },
  { value: "central", label: "ภาคกลาง" },
  { value: "northeast", label: "ภาคอีสาน" },
  { value: "west", label: "ภาคตะวันตก" },
  { value: "east", label: "ภาคตะวันออก" },
  { value: "south", label: "ภาคใต้" },
];

const CATEGORY_OPTIONS = [
  { value: "trending", label: "ทริปมาแรง" },
  { value: "youtuber", label: "ทริปตามรอย Youtuber" },
  { value: "cultural", label: "ทริปเชิงวัฒนธรรม" },
  { value: "one_day", label: "เที่ยววันเดียว" },
  { value: "trekking", label: "ทริปเดินป่า" },
];

const BOOKING_STATUS: Record<string, { label: string; className: string }> = {
  pending: {
    label: "รอยืนยัน",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  confirmed: {
    label: "ยืนยันแล้ว",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  cancelled: {
    label: "ยกเลิก",
    className: "bg-rose-100 text-rose-600 border-rose-200",
  },
};

function formatDateForInput(isoStr: string) {
  if (!isoStr) return "";
  return isoStr.slice(0, 10);
}

function formatThaiDate(isoStr: string) {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 0,
});

const TripDetail = () => {
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId: string }>();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [editingDescription, setEditingDescription] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    content: "",
    province: "",
    location: "",
    category: "",
    country: "Thailand",
    price_per_person: "",
    capacity: 0,
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (!tripId) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [tripData, bookingsData] = await Promise.all([
          GetTripById(tripId!),
          GetBookingsByTrip(tripId!),
        ]);

        if (tripData) {
          setTrip(tripData);
          setForm({
            name: tripData.name,
            description: tripData.description,
            content: tripData.content,
            province: tripData.province,
            location: tripData.location,
            category: tripData.category,
            country: tripData.country || "Thailand",
            price_per_person: tripData.price_per_person,
            capacity: tripData.capacity,
            start_date: formatDateForInput(tripData.start_date),
            end_date: formatDateForInput(tripData.end_date),
          });
        }
        setBookings(bookingsData);
      } catch (error) {
        console.error("Failed to fetch trip data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [tripId]);

  async function handleSave() {
    if (!tripId || saving) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const result = await UpdateTrip(tripId, {
        name: form.name,
        description: form.description,
        content: form.content,
        province: form.province,
        location: form.location,
        category: form.category,
        country: form.country,
        price_per_person: form.price_per_person,
        capacity: form.capacity,
        start_date: form.start_date ? `${form.start_date}T00:00:00Z` : undefined,
        end_date: form.end_date ? `${form.end_date}T00:00:00Z` : undefined,
      });
      if (result) {
        setTrip(result);
        setSaveMessage("บันทึกเรียบร้อยแล้ว");
      } else {
        setSaveMessage("บันทึกไม่สำเร็จ");
      }
    } finally {
      setSaving(false);
      window.setTimeout(() => setSaveMessage(null), 2500);
    }
  }

  async function handleDeleteBooking() {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      const ok = await DeleteBooking(deleteTarget.id);
      if (ok) {
        setBookings((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  const totalBooked = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + b.group_size, 0);

  const galleryImages = trip?.images ?? [];
  const thumbnailUrl = trip?.thumbnail_image;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-slate-500">
        <Loader2 className="size-5 animate-spin" />
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="size-4" />
          กลับ
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>ไม่พบข้อมูลทริป</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          กลับไปหน้าทริป
        </Button>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-sm font-medium text-emerald-700">
              {saveMessage}
            </span>
          )}
          <Button onClick={handleSave} disabled={saving} className="min-w-[120px] gap-2">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </div>

      {/* Trip Images */}
      {(thumbnailUrl || galleryImages.length > 0) && (() => {
        const allImages = [
          ...(thumbnailUrl ? [{ id: "thumb", url: thumbnailUrl, alt: form.name }] : []),
          ...galleryImages
            .filter((img) => !img.image_thumbnail && img.image_url)
            .map((img) => ({ id: String(img.id), url: img.image_url!, alt: "" })),
        ].slice(0, 3);

        if (allImages.length === 0) {
          return (
            <Card>
              <CardContent className="p-4">
                <div className="flex h-64 items-center justify-center rounded-xl bg-slate-100 md:h-80">
                  <ImageIcon className="size-12 text-slate-300" />
                </div>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                {allImages.map((img, idx) => {
                  const total = allImages.length;
                  let spanClass = "md:col-span-4";

                  if (total === 1) spanClass = "md:col-span-12";
                  else if (total === 2) spanClass = "md:col-span-6";
                  else if (total === 3) spanClass = "md:col-span-4";
                  else if (total === 4) spanClass = "md:col-span-6 lg:col-span-3";
                  else if (total === 5) {
                    spanClass = idx < 2 ? "md:col-span-6" : "md:col-span-4";
                  } else {
                    const rows = Math.ceil(total / 3);
                    const isLastRow = Math.floor(idx / 3) === rows - 1;
                    const rem = total % 3;
                    if (isLastRow && rem === 1) spanClass = "md:col-span-12";
                    else if (isLastRow && rem === 2) spanClass = "md:col-span-6";
                    else spanClass = "md:col-span-4";
                  }

                  return (
                    <div key={img.id} className={cn("overflow-hidden rounded-xl", spanClass)}>
                      <img
                        src={img.url}
                        alt={img.alt}
                        className={cn(
                          "w-full object-cover transition-transform hover:scale-105",
                          total === 1 ? "h-64 md:h-80" : "h-48 md:h-64"
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Trip Info Header */}
      <Card className="relative">
        <div className="absolute right-5 top-3 flex items-center gap-2">
          <Badge className="rounded-lg border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
            {trip.category_label}
          </Badge>
          <Badge className="rounded-lg border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
            {currencyFormatter.format(parseFloat(form.price_per_person))} / คน
          </Badge>
        </div>
        <CardHeader className="px-5 py-4">
          <div className="space-y-2 pr-48">
            <CardTitle className="text-xl font-semibold">{form.name}</CardTitle>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 text-slate-400" />
                {form.province}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4 text-slate-400" />
                {formatThaiDate(trip.start_date)} – {formatThaiDate(trip.end_date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-4 text-slate-400" />
                {form.capacity} ที่นั่ง
              </span>
              <span className="flex items-center gap-1.5">
                <UserCheck className="size-4 text-slate-400" />
                จองแล้ว {totalBooked} คน
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Editable Form */}
      <Card>
        <CardHeader className="px-8 pt-7 pb-2">
          <CardTitle className="text-lg">แก้ไขรายละเอียดทริป</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>ชื่อทริป</Label>
              <Input
                value={form.name}
                className="transition-colors focus-visible:ring-indigo-500 focus:bg-indigo-50/50 hover:bg-slate-50"
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>จังหวัด</Label>
              <Input
                value={form.province}
                className="transition-colors focus-visible:ring-indigo-500 focus:bg-indigo-50/50 hover:bg-slate-50"
                onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className={editingDescription ? "text-indigo-600 font-semibold" : ""}>
                คำอธิบายสั้น {editingDescription && "(กำลังแก้ไข)"}
              </Label>
              <Button
                type="button"
                variant={editingDescription ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-7 gap-1.5 text-xs text-muted-foreground",
                  editingDescription && "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                )}
                onClick={() => setEditingDescription((v) => !v)}
              >
                {editingDescription ? (
                  <><Eye className="size-3.5" />พรีวิว</>
                ) : (
                  <><Pencil className="size-3.5" />แก้ไข</>
                )}
              </Button>
            </div>
            {editingDescription ? (
              <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/30 p-1 shadow-inner ring-offset-background focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2">
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={4}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 resize-none font-medium text-sm"
                  placeholder="พิมพ์คำอธิบายที่นี่..."
                />
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setEditingDescription(true)}>
                {form.description ? (
                  <div className="prose prose-sm prose-slate max-w-none text-slate-700 leading-relaxed font-medium">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                      {form.description}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic text-sm">ไม่มีคำอธิบาย (คลิกเพื่อเพิ่ม)</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className={editingContent ? "text-indigo-600 font-semibold" : ""}>
                เนื้อหาทริป {editingContent && "(กำลังแก้ไข)"}
              </Label>
              <Button
                type="button"
                variant={editingContent ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-7 gap-1.5 text-xs text-muted-foreground",
                  editingContent && "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                )}
                onClick={() => setEditingContent((v) => !v)}
              >
                {editingContent ? (
                  <><Eye className="size-3.5" />พรีวิว</>
                ) : (
                  <><Pencil className="size-3.5" />แก้ไข</>
                )}
              </Button>
            </div>
            {editingContent ? (
              <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/30 p-1 shadow-inner ring-offset-background focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2">
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  rows={10}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 resize-y font-medium min-h-[160px] text-sm"
                  placeholder="พิมพ์เนื้อหาที่นี่..."
                />
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-5 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setEditingContent(true)}>
                {form.content ? (
                  <TripMarkdown content={form.content} />
                ) : (
                  <p className="text-muted-foreground italic text-sm">ไม่มีเนื้อหา (คลิกเพื่อเพิ่ม)</p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>ภูมิภาค</Label>
              <Select
                value={form.location}
                onValueChange={(v) => setForm((p) => ({ ...p, location: v }))}
              >
                <SelectTrigger className="transition-colors hover:bg-slate-50 focus-visible:ring-indigo-500 focus:bg-indigo-50/50">
                  <SelectValue placeholder="เลือกภูมิภาค" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>หมวดหมู่</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger className="transition-colors hover:bg-slate-50 focus-visible:ring-indigo-500 focus:bg-indigo-50/50">
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ประเทศ</Label>
              <Input
                value={form.country}
                className="transition-colors focus-visible:ring-indigo-500 focus:bg-indigo-50/50 hover:bg-slate-50"
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>ราคาต่อคน (บาท)</Label>
              <Input
                type="number"
                min={0}
                className="transition-colors focus-visible:ring-indigo-500 focus:bg-indigo-50/50 hover:bg-slate-50"
                value={form.price_per_person}
                onChange={(e) => setForm((p) => ({ ...p, price_per_person: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>จำนวนที่นั่ง</Label>
              <Input
                type="number"
                min={0}
                className="transition-colors focus-visible:ring-indigo-500 focus:bg-indigo-50/50 hover:bg-slate-50"
                value={form.capacity}
                onChange={(e) =>
                  setForm((p) => ({ ...p, capacity: parseInt(e.target.value, 10) || 0 }))
                }
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>วันที่เริ่มต้น</Label>
              <Input
                type="date"
                className="transition-colors focus-visible:ring-indigo-500 focus:bg-indigo-50/50 hover:bg-slate-50"
                value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>วันที่สิ้นสุด</Label>
              <Input
                type="date"
                className="transition-colors focus-visible:ring-indigo-500 focus:bg-indigo-50/50 hover:bg-slate-50"
                value={form.end_date}
                onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card className="relative">
        <Badge className="absolute right-5 top-5 border-slate-300 bg-slate-200 text-slate-700 hover:bg-slate-200">
          {bookings.length} รายการ
        </Badge>
        <CardHeader className="px-8 pt-7 pb-4">
          <CardTitle className="text-lg">รายชื่อลูกค้าที่จอง</CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <Table className="w-full border-separate border-spacing-x-2">
            <TableHeader>
              <TableRow>
                <TableHead className="px-5 py-3.5">ลูกค้า</TableHead>
                <TableHead className="px-5 py-3.5 text-center">จำนวนคน</TableHead>
                <TableHead className="px-5 py-3.5 text-right">ยอดชำระ</TableHead>
                <TableHead className="px-5 py-3.5 text-center">สถานะ</TableHead>
                <TableHead className="px-5 py-3.5">วันที่จอง</TableHead>
                <TableHead className="w-14 px-2 py-3.5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length > 0 ? (
                bookings.map((b) => {
                  const statusInfo = BOOKING_STATUS[b.status] ?? BOOKING_STATUS.pending;
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="px-5 py-4 font-medium text-slate-900">
                        {b.customer_name}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <Users className="size-4 text-slate-400" />
                          {b.group_size}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-right font-medium text-slate-700">
                        {currencyFormatter.format(parseFloat(b.total_price))}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", statusInfo.className)}
                        >
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-slate-600">
                        {formatThaiDate(b.created_at)}
                      </TableCell>
                      <TableCell className="w-14 px-2 py-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              onClick={() =>
                                setDeleteTarget({ id: b.id, name: b.customer_name })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>ลบออกจากทริป</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                    ยังไม่มีลูกค้าจองทริปนี้
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบลูกค้าคนนี้ออกจากทริปใช่หรือไม่
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={handleDeleteBooking}
            >
              {isDeleting ? "กำลังลบ..." : "ลบออก"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TripDetail;
