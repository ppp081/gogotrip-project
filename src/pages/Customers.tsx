import { useMemo, useState, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CUSTOMERS } from "./customers-data";
export default function Customers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return CUSTOMERS;
    return CUSTOMERS.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.lineId]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [searchTerm]);

  return (
    <div className="flex flex-col gap-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900">ข้อมูลลูกค้า</h1>
      </header>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-1/2 lg:w-1/3">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-12 rounded-full border-slate-200 bg-white pl-12 pr-4 text-base shadow-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            placeholder="ค้นหาชื่อลูกค้า อีเมล หรือ Line ID"
            aria-label="ค้นหาลูกค้า"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      <Card className="py-5">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl font-semibold text-slate-900">
              รายชื่อลูกค้า
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-5">
          <Table className="text-sm">
            <TableHeader className="bg-slate-50/70">
              <TableRow>
                <TableHead className="w-[70px] text-center">โปรไฟล์</TableHead>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>เบอร์ติดต่อ</TableHead>
                <TableHead>Line ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  onClick={() => navigate(`/customers/${customer.id}`)}
                  onKeyDown={(event: KeyboardEvent<HTMLTableRowElement>) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/customers/${customer.id}`);
                    }
                  }}
                  tabIndex={0}
                  className="cursor-pointer transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <TableCell>
                    <div className="flex justify-center">
                      <Avatar className="h-12 w-12 ring-2 ring-blue-100">
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
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    <span>{customer.name}</span>
                  </TableCell>
                  <TableCell className="text-slate-600">{customer.email}</TableCell>
                  <TableCell className="text-slate-600">{customer.phone}</TableCell>
                  <TableCell className="text-slate-600">{customer.lineId}</TableCell>
                </TableRow>
              ))}
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                    ไม่พบลูกค้าที่ตรงกับคำค้นหา
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
