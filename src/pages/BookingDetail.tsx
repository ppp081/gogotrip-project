import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  MapPin,
  ShoppingBag,
  Users,
} from "lucide-react";
import {
  BOOKING_DATA,
  STATUS_META,
  currencyFormatter,
} from "./bookings-data";

const BookingDetail = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();

  const booking = useMemo(
    () => BOOKING_DATA.find((item) => item.id === bookingId),
    [bookingId],
  );

  if (!booking) {
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
          <CardHeader>
            <CardTitle className="text-lg">ไม่พบข้อมูลคำสั่งซื้อ</CardTitle>
            <CardDescription>กรุณาเลือกคำสั่งซื้อจากรายการอีกครั้ง</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const statusInfo = STATUS_META[booking.status];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => navigate("/bookings")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          ย้อนกลับไปหน้ารายการการจองลูกค้า
        </Button>
        <Badge className={cn("rounded-full px-4 py-1 text-xs", statusInfo.badgeClass)}>
          {statusInfo.label}
        </Badge>
      </div>

      <Card className="border-none shadow-sm">
          <div className="flex px-5 py-5 flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <ShoppingBag className="size-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  {booking.transactionCode}
                </CardTitle>
              </div>
            </div>
            <div className="text-right text-xsf text-slate-500">
              <p className="mb-1">ยอดชำระรวม</p>
              <p className="text-xl font-semibold text-slate-900">
                {currencyFormatter.format(booking.payment.total)}
              </p>
            </div>
          </div>

        <CardContent className="space-y-10 py-1">
          <section className="grid gap-6 text-sm text-slate-600 md:grid-cols-2">
            <div className="flex h-full flex-col gap-4">
              <h3 className="text-sm font-semibold text-slate-900">รายละเอียดคำสั่งซื้อ</h3>
              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">ลูกค้า</span>
                  <span className="font-medium text-slate-900">{booking.traveler}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">วันที่ชำระ</span>
                  <span>{booking.purchasedAt}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">ปลายทางการเดินทาง</span>
                  <span className="flex items-center gap-2 font-medium text-slate-900">
                    <MapPin className="size-4 text-slate-400" />
                    {booking.destination}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex h-full flex-col gap-4">
              <h3 className="text-sm font-semibold text-slate-900">ข้อมูลลูกค้า</h3>
              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Line ID</span>
                  <span className="font-medium text-slate-900">{booking.lineId}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">จำนวนผู้ร่วมเดินทาง</span>
                  <span className="flex items-center gap-2 font-medium text-slate-900">
                    <Users className="size-4 text-slate-400" />
                    {booking.participants} คน
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">รายละเอียดการชำระเงิน</h3>
            <div className="overflow-hidden rounded-xl border border-slate-200 flex justify-start px-6 py-4">
              <img
                src="https://s359.thaicdn.net//pagebuilder/ba154685-db18-4ac7-b318-a4a2b15b9d4c.jpg"
                alt="หลักฐานการชำระเงิน"
                className="w-full max-w-xs rounded-lg object-cover shadow-sm"
              />
            </div>
          </section>

        </CardContent>
      </Card>
    </div>
  );
};

export default BookingDetail;
