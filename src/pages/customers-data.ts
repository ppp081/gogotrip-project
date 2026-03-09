import type { BookingStatus } from "./bookings-data";

export type TripStatus = "completed" | "upcoming" | "cancelled" | "in-progress";

export type CustomerTrip = {
  id: string;
  tripName: string;
  travelDate: string;
  participants: number;
  amount: number;
  paymentStatus: BookingStatus;
  tripStatus: TripStatus;
};

export type CustomerRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  lineId: string;
  avatar: string;
  status: "active" | "vip" | "inactive";
  totalSpend: number;
  lastBookingDate: string;
  lastTripName: string;
  trips: CustomerTrip[];
};

export const CUSTOMERS: CustomerRecord[] = [
  {
    id: "CUS-001",
    name: "สุภาวดี ศรีสกุล",
    email: "supawadee.srisakul@example.com",
    phone: "+66 80-123-4567",
    lineId: "@supawadee.travel",
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80",
    status: "vip",
    totalSpend: 7500,
    lastBookingDate: "18 ส.ค. 2024",
    lastTripName: "ทริปเดินป่าระยะไกลคลองยัน",
    trips: [
      {
        id: "T-1001",
        tripName: "ทริปเดินป่าระยะไกลคลองยัน",
        travelDate: "12 ก.ย. 2024",
        participants: 3,
        amount: 1500,
        paymentStatus: "pending",
        tripStatus: "upcoming",
      },
      {
        id: "T-0954",
        tripName: "ดอยอินทนนท์ ล่าหมอก",
        travelDate: "15 พ.ย. 2023",
        participants: 3,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "completed",
      },
      {
        id: "T-0823",
        tripName: "เดินป่าภูกระดึง",
        travelDate: "02 เม.ย. 2023",
        participants: 2,
        amount: 1500,
        paymentStatus: "failed",
        tripStatus: "cancelled",
      },
      {
        id: "T-0712",
        tripName: "อยุธยาหนึ่งวันย้อนเวลา",
        travelDate: "12 ม.ค. 2023",
        participants: 4,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "completed",
      },
      {
        id: "T-0598",
        tripName: "ทะเลระยอง ซันเซ็ต",
        travelDate: "25 ธ.ค. 2022",
        participants: 2,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "completed",
      },
    ],
  },
  {
    id: "CUS-002",
    name: "ณัฐดนัย วัฒน์สุข",
    email: "nattadanai.ws@example.com",
    phone: "+66 82-345-6789",
    lineId: "@natta.travels",
    avatar:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=80",
    status: "active",
    totalSpend: 4500,
    lastBookingDate: "12 ก.ค. 2024",
    lastTripName: "เที่ยวทะเลระยอง 3 วัน",
    trips: [
      {
        id: "T-1012",
        tripName: "เที่ยวทะเลระยอง 3 วัน",
        travelDate: "20 ก.ย. 2024",
        participants: 3,
        amount: 1500,
        paymentStatus: "pending",
        tripStatus: "upcoming",
      },
      {
        id: "T-0881",
        tripName: "ผจญภัยเขาใหญ่",
        travelDate: "30 ธ.ค. 2023",
        participants: 2,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "completed",
      },
      {
        id: "T-0764",
        tripName: "แคมป์ปิ้งเขาใหญ่",
        travelDate: "14 ก.ย. 2023",
        participants: 2,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "completed",
      },
    ],
  },
  {
    id: "CUS-003",
    name: "ปิยวดี เทียนทอง",
    email: "piyawadee.tt@example.com",
    phone: "+66 81-111-2233",
    lineId: "@piya.foodie",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
    status: "active",
    totalSpend: 3000,
    lastBookingDate: "29 ก.ค. 2024",
    lastTripName: "ผจญภัยป่าฮาลา-บาลา",
    trips: [
      {
        id: "T-1050",
        tripName: "ผจญภัยป่าฮาลา-บาลา",
        travelDate: "28 ต.ค. 2024",
        participants: 4,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "upcoming",
      },
      {
        id: "T-0890",
        tripName: "ล่องเรืออ่าวพังงา",
        travelDate: "10 ก.พ. 2024",
        participants: 2,
        amount: 1500,
        paymentStatus: "failed",
        tripStatus: "cancelled",
      },
    ],
  },
  {
    id: "CUS-004",
    name: "สมชาย ประเสริฐ",
    email: "somchai.prasert@example.com",
    phone: "+66 85-987-6543",
    lineId: "@somchai.travel",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    status: "inactive",
    totalSpend: 3000,
    lastBookingDate: "04 ก.พ. 2023",
    lastTripName: "พายเรือคลองลัดมะยม",
    trips: [
      {
        id: "T-0401",
        tripName: "พายเรือคลองลัดมะยม",
        travelDate: "18 ก.พ. 2023",
        participants: 2,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "completed",
      },
      {
        id: "T-0244",
        tripName: "อยุธยาหนึ่งวันย้อนเวลา",
        travelDate: "12 ม.ค. 2022",
        participants: 4,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "completed",
      },
    ],
  },
  {
    id: "CUS-005",
    name: "อลิษา มงคลชัย",
    email: "alisa.mongkol@example.com",
    phone: "+66 86-555-0912",
    lineId: "@alisa.journey",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    status: "vip",
    totalSpend: 4500,
    lastBookingDate: "04 ก.ค. 2024",
    lastTripName: "แคมป์ปิ้งเขาใหญ่",
    trips: [
      {
        id: "T-1011",
        tripName: "แคมป์ปิ้งเขาใหญ่",
        travelDate: "20 พ.ย. 2024",
        participants: 2,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "upcoming",
      },
      {
        id: "T-0884",
        tripName: "ตามรอยโฮมคาเฟ่เชียงใหม่",
        travelDate: "10 ก.ย. 2023",
        participants: 2,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "completed",
      },
      {
        id: "T-0731",
        tripName: "คาเฟ่ภูเก็ต",
        travelDate: "05 เม.ย. 2023",
        participants: 3,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "completed",
      },
    ],
  },
  {
    id: "CUS-006",
    name: "เกรียงศักดิ์ ปัญญาไพบูลย์",
    email: "kriangsak.pp@example.com",
    phone: "+66 83-210-9876",
    lineId: "@kriangsak.trail",
    avatar:
      "https://images.unsplash.com/photo-1502766886759-93c3e39d836f?auto=format&fit=crop&w=200&q=80",
    status: "active",
    totalSpend: 4500,
    lastBookingDate: "01 ก.ค. 2024",
    lastTripName: "เส้นทางวัฒนธรรมเชียงใหม่",
    trips: [
      {
        id: "T-0998",
        tripName: "เส้นทางวัฒนธรรมเชียงใหม่",
        travelDate: "10 ส.ค. 2024",
        participants: 3,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "upcoming",
      },
      {
        id: "T-0835",
        tripName: "ล่องแพน้ำเพชร",
        travelDate: "15 ก.ย. 2023",
        participants: 2,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "completed",
      },
      {
        id: "T-0684",
        tripName: "อบสมุนไพรแม่กำปอง",
        travelDate: "06 ธ.ค. 2022",
        participants: 2,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "completed",
      },
    ],
  },
  {
    id: "CUS-007",
    name: "อมีนา ว่องไพบูลย์",
    email: "amena.wong@example.com",
    phone: "+66 89-456-7788",
    lineId: "@amenaexplores",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    status: "vip",
    totalSpend: 4500,
    lastBookingDate: "22 ก.ค. 2024",
    lastTripName: "เส้นทางกาแฟเชียงราย",
    trips: [
      {
        id: "T-0976",
        tripName: "เส้นทางกาแฟเชียงราย",
        travelDate: "14 ก.ย. 2024",
        participants: 2,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "upcoming",
      },
      {
        id: "T-0822",
        tripName: "ชิมสตรีทฟู้ดเยาวราช",
        travelDate: "12 พ.ค. 2023",
        participants: 2,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "completed",
      },
      {
        id: "T-0725",
        tripName: "เชียงราย วิวหมอก",
        travelDate: "20 ม.ค. 2023",
        participants: 3,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "completed",
      },
    ],
  },
  {
    id: "CUS-008",
    name: "ชาญชัย บัวทอง",
    email: "chanchai.bt@example.com",
    phone: "+66 87-654-3210",
    lineId: "@chanchai.trip",
    avatar:
      "https://images.unsplash.com/photo-1524502397800-2eeaadf3aee9?auto=format&fit=crop&w=200&q=80",
    status: "inactive",
    totalSpend: 4500,
    lastBookingDate: "01 ธ.ค. 2023",
    lastTripName: "ทัวร์ตลาดน้ำดำเนิน",
    trips: [
      {
        id: "T-0860",
        tripName: "ทัวร์ตลาดน้ำดำเนิน",
        travelDate: "20 ธ.ค. 2023",
        participants: 2,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "completed",
      },
      {
        id: "T-0703",
        tripName: "ภูเก็ต ซีฟู้ด เอ็กซ์คลูซีฟ",
        travelDate: "30 มิ.ย. 2022",
        participants: 2,
        amount: 1500,
        paymentStatus: "success",
        tripStatus: "completed",
      },
      {
        id: "T-0588",
        tripName: "ผจญภัยน้ำตกทีลอซู",
        travelDate: "15 ธ.ค. 2021",
        participants: 2,
        amount: 1500,
        paymentStatus: "failed",
        tripStatus: "cancelled",
      },
    ],
  },
];
