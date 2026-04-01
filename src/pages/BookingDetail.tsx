import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  GetBookingById,
  GetBookingEquipmentsByBooking,
  GetPaymentsByBooking,
  type Booking,
  type BookingEquipment,
  type Payment,
  type PaymentStatus,
} from "@/api/booking";
import { ArrowLeft, Loader2, MapPin, ShoppingBag, Users } from "lucide-react";
import { currencyFormatter } from "./bookings-data";

const BOOKING_STATUS_META: Record<
  Booking["status"],
  { label: string; badgeClass: string }
> = {
  pending: {
    label: "รอดำเนินการ",
    badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  confirmed: {
    label: "Success",
    badgeClass: "bg-emerald-500 text-white border-0 hover:bg-emerald-500",
  },
  cancelled: {
    label: "ยกเลิก",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
  },
};

const PAYMENT_METHOD_TH: Record<string, string> = {
  credit_card: "บัตรเครดิต",
  bank_transfer: "โอนธนาคาร",
  cash: "เงินสด",
  mobile_banking: "Mobile Banking",
  qr_code: "QR Code",
};

function formatThaiDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEquipments(items: BookingEquipment[]): string {
  if (items.length === 0) return "-";
  return items
    .map((e) => `${e.equipment_name} ×${e.quantity}`)
    .join(", ");
}

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "รอชำระ",
  slip_uploaded: "อัปโหลดสลิปแล้ว",
  verifying: "กำลังตรวจสอบ",
  paid: "ชำระแล้ว",
  failed: "ชำระไม่สำเร็จ",
  refunded: "คืนเงินแล้ว",
};

function derivePaymentLineStatus(payments: Payment[]): PaymentStatus {
  if (payments.some((p) => p.payment_status === "paid")) return "paid";
  if (payments.some((p) => p.payment_status === "verifying")) return "verifying";
  if (payments.some((p) => p.payment_status === "slip_uploaded"))
    return "slip_uploaded";
  if (payments.some((p) => p.payment_status === "failed")) return "failed";
  if (payments.some((p) => p.payment_status === "refunded")) return "refunded";
  return "pending";
}

function slipImageUrl(payments: Payment[]): string | null {
  for (const p of payments) {
    const url = (p.payment_url || "").trim();
    if (url) return url;
  }
  for (const p of payments) {
    const img = (p.slip_image || "").trim();
    if (img) return img;
  }
  return null;
}

const BookingDetail = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [equipments, setEquipments] = useState<BookingEquipment[]>([]);

  const load = useCallback(async () => {
    if (!bookingId) {
      setError("ไม่พบรหัสการจอง");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const b = await GetBookingById(bookingId);
      if (!b) {
        setBooking(null);
        setError("ไม่พบข้อมูลการจอง");
        return;
      }
      setBooking(b);
      const [payList, eqList] = await Promise.all([
        GetPaymentsByBooking(bookingId),
        GetBookingEquipmentsByBooking(bookingId),
      ]);
      setPayments(payList);
      setEquipments(eqList);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const destinationLabel = useMemo(() => {
    if (!booking) return "";
    const name = booking.trip_name || "";
    const prov = booking.trip_province || "";
    if (name && prov) return `${name} · ${prov}`;
    return name || prov || "-";
  }, [booking]);

  const paymentAtDisplay = useMemo(() => {
    const paid = payments.find((p) => p.paid_at);
    if (paid?.paid_at) return formatThaiDateTime(paid.paid_at);
    const first = payments[0];
    if (first?.created_at) return formatThaiDateTime(first.created_at);
    if (booking?.created_at) return formatThaiDateTime(booking.created_at);
    return "-";
  }, [payments, booking]);

  const totalAmount = useMemo(() => {
    if (!booking) return 0;
    const n = parseFloat(booking.total_price);
    return Number.isFinite(n) ? n : 0;
  }, [booking]);

  const orderRef = useMemo(() => {
    if (!booking) return "";
    const short = booking.id.replace(/-/g, "").slice(0, 8).toUpperCase();
    return `Payment Order #${short}`;
  }, [booking]);

  const lineLabel = useMemo(() => {
    if (!booking) return "-";
    const d = booking.line_display?.trim();
    if (d) return d.startsWith("@") ? d : `@${d}`;
    return "-";
  }, [booking]);

  const slipUrl = useMemo(() => slipImageUrl(payments), [payments]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">กำลังโหลดรายละเอียดการจอง…</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/bookings")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          ย้อนกลับไปหน้ารายการการจองลูกค้า
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-slate-600">
            <p className="font-medium text-slate-900">
              {error ?? "ไม่พบข้อมูลคำสั่งซื้อ"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              กรุณาเลือกคำสั่งซื้อจากรายการอีกครั้ง
            </p>
            <Button variant="outline" className="mt-4" onClick={() => void load()}>
              ลองใหม่
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = BOOKING_STATUS_META[booking.status];
  const paymentStatusKey = derivePaymentLineStatus(payments);
  const paymentStatusLabel = PAYMENT_STATUS_LABEL[paymentStatusKey];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => navigate("/bookings")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          ย้อนกลับไปหน้ารายการการจองลูกค้า
        </Button>
        <Badge
          className={cn(
            "rounded-full px-4 py-1 text-xs font-medium",
            statusInfo.badgeClass,
          )}
        >
          {statusInfo.label}
        </Badge>
      </div>

      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <ShoppingBag className="size-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                {orderRef}
              </CardTitle>
              <p className="text-xs text-slate-500">
                สถานะชำระ: {paymentStatusLabel} ·{" "}
                {payments[0]?.payment_method
                  ? PAYMENT_METHOD_TH[payments[0].payment_method] ??
                  payments[0].payment_method
                  : "-"}
              </p>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="mb-1 text-xs text-slate-500">ยอดชำระรวม</p>
            <p className="text-2xl font-semibold tabular-nums text-slate-900">
              {currencyFormatter.format(totalAmount)}
            </p>
          </div>
        </div>

        <CardContent className="space-y-10 px-5 py-8">
          <section className="grid gap-8 text-sm text-slate-600 md:grid-cols-2 md:gap-10">
            <div className="flex min-h-0 flex-col gap-4">
              <h3 className="text-sm font-semibold text-slate-900">
                รายละเอียดคำสั่งซื้อ
              </h3>
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                <div className="flex items-start justify-between gap-4">
                  <span className="shrink-0 text-slate-500">ลูกค้า</span>
                  <span className="text-right font-medium text-slate-900">
                    {booking.customer_name}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="shrink-0 text-slate-500">วันที่ชำระ</span>
                  <span className="text-right">{paymentAtDisplay}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="shrink-0 text-slate-500">ปลายทางการเดินทาง</span>
                  <span className="flex items-center justify-end gap-2 text-right font-medium text-slate-900">
                    <MapPin className="size-4 shrink-0 text-slate-400" />
                    {destinationLabel}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="shrink-0 text-slate-500">อุปกรณ์เสริม</span>
                  <span className="text-right font-medium text-slate-900">
                    {formatEquipments(equipments)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-col gap-4">
              <h3 className="text-sm font-semibold text-slate-900">
                ข้อมูลลูกค้า
              </h3>
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                <div className="flex items-start justify-between gap-4">
                  <span className="shrink-0 text-slate-500">Line ID</span>
                  <span className="text-right font-medium text-slate-900">
                    {lineLabel}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="shrink-0 text-slate-500">โทรศัพท์</span>
                  <span className="text-right font-medium text-slate-900">
                    {booking.customer_phone?.trim() || "-"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="shrink-0 text-slate-500">จำนวนผู้ร่วมเดินทาง</span>
                  <span className="flex items-center gap-2 font-medium text-slate-900">
                    <Users className="size-4 text-slate-400" />
                    {booking.group_size} คน
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              รายละเอียดการชำระเงิน
            </h3>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-6 sm:px-6">
              {slipUrl ? (
                <div className="flex justify-center">
                  <img
                    src={slipUrl}
                    alt="หลักฐานการชำระเงิน"
                    className="max-h-[min(70vh,520px)] w-full max-w-md rounded-lg object-contain shadow-md"
                  />
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-slate-500">
                  ยังไม่มีรูปสลิป — รออัปโหลดหรือ URL จากระบบชำระเงิน
                </p>
              )}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingDetail;
