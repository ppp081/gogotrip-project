export type BookingStatus = "pending" | "success" | "failed";

export type BookingTimelineItem = {
  id: string;
  date: string;
  title: string;
  description: string;
};

export type PaymentDetails = {
  method: string;
  brand: string;
  last4: string;
  shipmentFee: number;
  total: number;
};

export type BookingRecord = {
  id: string;
  transactionCode: string;
  destination: string;
  amount: number;
  participants: number;
  date: string;
  purchasedAt: string;
  status: BookingStatus;
  timeline: BookingTimelineItem[];
  payment: PaymentDetails;
  traveler: string;
  lineId: string;
};

export const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 2,
});

export const BOOKING_DATA: BookingRecord[] = [
  {
    id: "PAY-2710",
    transactionCode: "Payment Order #2710",
    destination: "เชียงใหม่ ฟู้ดทัวร์หนึ่งวัน",
    amount: 21950,
    participants: 3,
    date: "18 ส.ค. 2024",
    purchasedAt: "18 ส.ค. 2024, 16:01 น.",
    status: "pending",
    traveler: "สุพจน์ ศรีใจ",
    lineId: "@supoj.trip",
    payment: {
      method: "Credit Card",
      brand: "VISA",
      last4: "1843",
      shipmentFee: 1250,
      total: 23200,
    },
    timeline: [
      {
        id: "t1",
        date: "18 ส.ค. 2024",
        title: "ชำระเงินเสร็จสิ้น",
        description: "ได้รับยอดชำระจากลูกค้าแล้ว",
      },
      {
        id: "t2",
        date: "17 ส.ค. 2024",
        title: "ยืนยันรายการชำระ",
        description: "ระบบตรวจสอบรายละเอียดคำสั่งซื้อเรียบร้อย",
      },
      {
        id: "t3",
        date: "16 ส.ค. 2024",
        title: "รอการตรวจสอบ",
        description: "รอทีมการเงินตรวจสอบการชำระเงิน",
      },
    ],
  },
  {
    id: "PAY-2709",
    transactionCode: "Payment Order #2709",
    destination: "ทริปเดินป่าระยะไกลคลองยัน",
    amount: 14500,
    participants: 2,
    date: "12 ส.ค. 2024",
    purchasedAt: "12 ส.ค. 2024, 09:45 น.",
    status: "pending",
    traveler: "กมลทิพย์ ทองดี",
    lineId: "@kamon.cruise",
    payment: {
      method: "QR PromptPay",
      brand: "PromptPay",
      last4: "7890",
      shipmentFee: 450,
      total: 14950,
    },
    timeline: [
      {
        id: "t1",
        date: "12 ส.ค. 2024",
        title: "อยู่ระหว่างตรวจสอบ",
        description: "ข้อมูลสลิปถูกส่งให้ทีมการเงินแล้ว",
      },
      {
        id: "t2",
        date: "11 ส.ค. 2024",
        title: "ลูกค้าอัปโหลดสลิป",
        description: "ลูกค้าส่งหลักฐานการโอนเงิน",
      },
    ],
  },
  {
    id: "PAY-2708",
    transactionCode: "Payment Order #2708",
    destination: "ผจญภัยป่าฮาลา-บาลา",
    amount: 32900,
    participants: 4,
    date: "29 ก.ค. 2024",
    purchasedAt: "29 ก.ค. 2024, 14:17 น.",
    status: "success",
    traveler: "ศุภชัย ดวงดี",
    lineId: "@supachai.hike",
    payment: {
      method: "Credit Card",
      brand: "Mastercard",
      last4: "5521",
      shipmentFee: 0,
      total: 32900,
    },
    timeline: [
      {
        id: "t1",
        date: "29 ก.ค. 2024",
        title: "ชำระเงินเสร็จสิ้น",
        description: "ยอดเงินเข้าระบบเรียบร้อย",
      },
      {
        id: "t2",
        date: "27 ก.ค. 2024",
        title: "ออกตั๋วการเดินทาง",
        description: "ส่งใบยืนยันการเดินทางให้ลูกค้า",
      },
    ],
  },
  {
    id: "PAY-2707",
    transactionCode: "Payment Order #2707",
    destination: "เส้นทางกาแฟเชียงราย",
    amount: 18950,
    participants: 2,
    date: "22 ก.ค. 2024",
    purchasedAt: "22 ก.ค. 2024, 17:35 น.",
    status: "success",
    traveler: "จิราภา พงศ์สถิตย์",
    lineId: "@jirapa.coffee",
    payment: {
      method: "Bank Transfer",
      brand: "SCB",
      last4: "8722",
      shipmentFee: 0,
      total: 18950,
    },
    timeline: [
      {
        id: "t1",
        date: "22 ก.ค. 2024",
        title: "ยืนยันการชำระเงิน",
        description: "ตรวจสอบสลิปโอนเงินเรียบร้อย",
      },
      {
        id: "t2",
        date: "21 ก.ค. 2024",
        title: "ลูกค้าแจ้งโอนเงิน",
        description: "ลูกค้าส่งหลักฐานการชำระเงิน",
      },
    ],
  },
  {
    id: "PAY-2706",
    transactionCode: "Payment Order #2706",
    destination: "เที่ยวทะเลระยอง 3 วัน",
    amount: 28900,
    participants: 3,
    date: "12 ก.ค. 2024",
    purchasedAt: "12 ก.ค. 2024, 21:12 น.",
    status: "pending",
    traveler: "ทศพล จันทรา",
    lineId: "@tossapol.beach",
    payment: {
      method: "Credit Card",
      brand: "JCB",
      last4: "6655",
      shipmentFee: 0,
      total: 28900,
    },
    timeline: [
      {
        id: "t1",
        date: "12 ก.ค. 2024",
        title: "รอตรวจสอบจากธนาคาร",
        description: "ส่งคำขออนุมัติบัตรเครดิต",
      },
    ],
  },
  {
    id: "PAY-2705",
    transactionCode: "Payment Order #2705",
    destination: "แคมป์ปิ้งเขาใหญ่",
    amount: 25900,
    participants: 2,
    date: "04 ก.ค. 2024",
    purchasedAt: "04 ก.ค. 2024, 11:03 น.",
    status: "success",
    traveler: "ภัทรวดี โชติรัตน์",
    lineId: "@patrawadee.ski",
    payment: {
      method: "Credit Card",
      brand: "VISA",
      last4: "0145",
      shipmentFee: 0,
      total: 25900,
    },
    timeline: [
      {
        id: "t1",
        date: "04 ก.ค. 2024",
        title: "ชำระเงินเสร็จสิ้น",
        description: "ยอดเงินเข้าบัญชีเรียบร้อย",
      },
    ],
  },
  {
    id: "PAY-2704",
    transactionCode: "Payment Order #2704",
    destination: "ระนอง ออนเซ็นทะเล",
    amount: 12900,
    participants: 3,
    date: "01 มิ.ย. 2024",
    purchasedAt: "01 มิ.ย. 2024, 09:58 น.",
    status: "success",
    traveler: "ยศพล ศรีอรุณ",
    lineId: "@yotsaphon.bali",
    payment: {
      method: "QR PromptPay",
      brand: "PromptPay",
      last4: "0021",
      shipmentFee: 0,
      total: 12900,
    },
    timeline: [
      {
        id: "t1",
        date: "01 มิ.ย. 2024",
        title: "ตรวจสอบการชำระสำเร็จ",
        description: "ยอดเข้าเรียบร้อย",
      },
    ],
  },
  {
    id: "PAY-2703",
    transactionCode: "Payment Order #2703",
    destination: "ผจญภัยภูเขียว",
    amount: 35900,
    participants: 1,
    date: "15 มิ.ย. 2024",
    purchasedAt: "15 มิ.ย. 2024, 10:20 น.",
    status: "failed",
    traveler: "อนุชา ศิลปชัย",
    lineId: "@anutcha.kili",
    payment: {
      method: "Credit Card",
      brand: "VISA",
      last4: "8710",
      shipmentFee: 1500,
      total: 37400,
    },
    timeline: [
      {
        id: "t1",
        date: "15 มิ.ย. 2024",
        title: "การชำระเงินล้มเหลว",
        description: "ธนาคารปฏิเสธการตัดบัตร",
      },
      {
        id: "t2",
        date: "15 มิ.ย. 2024",
        title: "แจ้งลูกค้าให้ติดต่อธนาคาร",
        description: "ส่งอีเมลแจ้งให้ติดต่อธนาคาร",
      },
    ],
  },
];

export const STATUS_META: Record<
  BookingStatus,
  { label: string; badgeClass: string; dotClass: string; description: string }
> = {
  pending: {
    label: "Pending",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    dotClass: "bg-amber-500",
    description: "รอการตรวจสอบการชำระเงิน",
  },
  success: {
    label: "Success",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    dotClass: "bg-emerald-500",
    description: "รายการชำระเงินสำเร็จสมบูรณ์",
  },
  failed: {
    label: "Failed",
    badgeClass: "bg-rose-100 text-rose-600 border border-rose-200",
    dotClass: "bg-rose-500",
    description: "การชำระเงินไม่สำเร็จ ต้องติดต่อลูกค้า",
  },
};

export const STATUS_OPTIONS: Array<{ value: BookingStatus | "all"; label: string }> = [
  { value: "all", label: "สถานะทั้งหมด" },
  { value: "pending", label: "Pending" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
];
