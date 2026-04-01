import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, MapPin, Users, Mail, Phone, MessageCircle, ArrowLeft, Loader2, User } from "lucide-react";
import { GetCustomerById, type CustomerDetail as ICustomerDetail } from "@/api/customer";

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 0,
});

function formatThaiDate(isoStr: string) {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const CustomerDetail = () => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<ICustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerId) {
      GetCustomerById(customerId).then((data) => {
        setCustomer(data);
        setLoading(false);
      });
    }
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/customers")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          กลับไปหน้ารายชื่อลูกค้า
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ไม่พบข้อมูลลูกค้า</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const latestBooking = customer.bookings.length > 0 ? customer.bookings[0] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => navigate("/customers")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          กลับไปหน้ารายชื่อลูกค้า
        </Button>
      </div>

      <Card className="border-none shadow-sm py-5">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 ">
            <Avatar className="h-16 w-16 ring-2 ring-blue-100 ">
              <AvatarImage src={customer.picture_url} alt={customer.display_name} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900">{customer.display_name}</CardTitle>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <Mail className="size-4 text-slate-400" />
                {customer.email || "ไม่ได้ระบุอีเมล"}
              </p>
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Phone className="size-4 text-slate-400" />
                {customer.phone || "ไม่ได้ระบุเบอร์โทร"}
              </p>
              <p className="flex items-center gap-2 text-sm text-slate-500 font-mono text-xs">
                <MessageCircle className="size-4 text-slate-400" />
                Line ID: {customer.line_user_id}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 py-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase text-slate-500">จำนวนทริปที่เคยจอง</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{customer.bookings.length} ทริป</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase text-slate-500">ทริปล่าสุด</p>
              <p className="mt-2 text-base font-semibold text-slate-900 truncate" title={latestBooking?.trip_name || "-"}>
                {latestBooking?.trip_name || "-"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase text-slate-500">วันที่จองล่าสุด</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {latestBooking ? formatThaiDate(latestBooking.created_at) : "-"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase text-slate-500">ยอดใช้จ่ายรวมทั้งหมด</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {currencyFormatter.format(customer.total_spend || 0)}
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">ประวัติการจองทั้งหมด</h3>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="text-xs uppercase tracking-wide text-slate-500">
                    <TableHead className="px-6 py-3 text-slate-600 text-sm font-semibold">ทริป</TableHead>
                    <TableHead className="px-6 py-3 text-slate-600 text-sm font-semibold">วันที่จอง</TableHead>
                    <TableHead className="px-6 py-3 text-slate-600 text-sm font-semibold text-center">จำนวนคน</TableHead>
                    <TableHead className="px-6 py-3 text-slate-600 text-sm font-semibold text-right">ยอดชำระ</TableHead>
                    <TableHead className="px-6 py-3 text-slate-600 text-sm font-semibold text-center">สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.bookings.length > 0 ? (
                    customer.bookings.map((booking) => (
                      <TableRow key={booking.id} className="text-sm text-slate-700">
                        <TableCell className="px-6 py-4 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <MapPin className="size-4 text-slate-400" />
                            {booking.trip_name}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-slate-600">{formatThaiDate(booking.created_at)}</TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1">
                            <Users className="size-4 text-slate-400" />
                            {booking.group_size}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right font-semibold text-slate-900">
                          {currencyFormatter.format(parseFloat(booking.total_price))}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                            booking.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {booking.status === 'confirmed' ? 'สำเร็จ' : booking.status === 'pending' ? 'รอยืนยัน' : 'ยกเลิก'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                        ยังไม่มีประวัติการจอง
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDetail;
