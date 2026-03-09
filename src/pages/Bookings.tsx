import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
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
  Search,
  ShoppingBag,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BOOKING_DATA,
  STATUS_META,
  STATUS_OPTIONS,
  currencyFormatter,
  type BookingStatus,
} from "./bookings-data";

const Bookings = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");

  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return BOOKING_DATA.filter((booking) => {
      const matchesSearch =
        term.length === 0 ||
        [
          booking.transactionCode,
          booking.destination,
          booking.traveler,
          booking.lineId,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

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
              <DropdownMenu>
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
                      setStatusFilter(value as BookingStatus | "all")
                    }
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <DropdownMenuRadioItem key={option.value} value={option.value}>
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="px-5">
            <Table>
              <colgroup>
                <col style={{ width: "320px" }} />
                <col style={{ width: "220px" }} />
                <col style={{ width: "180px" }} />
                <col style={{ width: "160px" }} />
                <col style={{ width: "140px" }} />
                <col style={{ width: "160px" }} />
                <col style={{ width: "180px" }} />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[320px] px-6 pb-2 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    รายการ
                  </TableHead>
                  <TableHead className="w-[220px] px-6 pb-2 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    ชื่อลูกค้า
                  </TableHead>
                  <TableHead className="w-[180px] px-6 pb-2 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Line ID
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
                {filteredBookings.map((booking) => {
                  const statusInfo = STATUS_META[booking.status];

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
                            <p className="text-sm font-semibold text-slate-900">
                              {booking.transactionCode}
                            </p>
                            <p className="text-xs text-slate-400">
                              {booking.destination}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-left text-sm text-slate-700">
                        {booking.traveler}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-left text-sm text-slate-600">
                        {booking.lineId}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                        {currencyFormatter.format(booking.amount)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center text-sm text-slate-600">
                        {booking.participants} คน
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center text-sm text-slate-600">
                        {booking.date}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <Badge className={cn("rounded-full px-3 py-1 text-xs", statusInfo.badgeClass)}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
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
