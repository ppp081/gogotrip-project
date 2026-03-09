import { useMemo } from "react";
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
import { CalendarDays, MapPin, Users, Mail, Phone, MessageCircle, ArrowLeft } from "lucide-react";
import {
  CUSTOMERS,
  type CustomerRecord,
} from "./customers-data";
import { currencyFormatter } from "./bookings-data";

const CustomerDetail = () => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();

  const customer = useMemo(
    () => CUSTOMERS.find((item) => item.id === customerId),
    [customerId],
  );

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

  const totalTrips = customer.trips.length;
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
              <AvatarImage src={customer.avatar} alt={customer.name} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {customer.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900">{customer.name}</CardTitle>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <Mail className="size-4 text-slate-400" />
                {customer.email}
              </p>
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Phone className="size-4 text-slate-400" />
                {customer.phone}
              </p>
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <MessageCircle className="size-4 text-slate-400" />
                Line ID: {customer.lineId}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 py-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase text-slate-500">จำนวนทริปที่เคยจอง</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{totalTrips} ทริป</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase text-slate-500">ทริปล่าสุด</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{customer.lastTripName}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase text-slate-500">วันที่จองล่าสุด</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{customer.lastBookingDate}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase text-slate-500">ยอดใช้จ่ายรวมทั้งหมด</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {currencyFormatter.format(customer.totalSpend)}
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
                    <TableHead className="px-6 py-3 text-slate-600 text-sm font-semibold">วันที่เดินทาง</TableHead>
                    <TableHead className="px-6 py-3 text-slate-600 text-sm font-semibold text-center">จำนวนคน</TableHead>
                    <TableHead className="px-6 py-3 text-slate-600 text-sm font-semibold text-right">ยอดชำระ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.trips.map((trip) => (
                    <TableRow key={trip.id} className="text-sm text-slate-700">
                      <TableCell className="px-6 py-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-slate-400" />
                          {trip.tripName}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-slate-600">{trip.travelDate}</TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-4 text-slate-400" />
                          {trip.participants}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-semibold text-slate-900">
                        {currencyFormatter.format(trip.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
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
