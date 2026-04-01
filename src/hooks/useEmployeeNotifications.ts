import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/api/client";
import { showBookingNotificationToast } from "@/components/BookingNotificationToast";
import { NOTIFICATION_EVENT } from "@/lib/notification-bus";
import { playNotificationSound } from "@/lib/notification-sound";

/** รายการแจ้งเตือนหลัง parse สำหรับ UI (DB ก่อน แล้ว fallback payload) */
export type EmployeeNotification = {
  id: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  type: "booking";
  tripName: string;
  tripProvince: string;
  customerName: string;
  bookingStatus: string;
  bookingTotal: string;
  groupSize: number;
  /** บรรทัดรองรับการแสดงใน dropdown */
  detailLine: string;
  title: string;
};

type ApiNotificationRow = {
  id: string;
  booking: string;
  payload?: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
  read?: boolean;
  trip_name?: string | null;
  trip_province?: string | null;
  customer_name?: string | null;
  booking_status?: string | null;
  booking_total?: string | number | null;
  group_size?: number | null;
};

const BOOKING_STATUS_TH: Record<string, string> = {
  pending: "รอดำเนินการ",
  confirmed: "ยืนยันแล้ว",
  cancelled: "ยกเลิก",
};

function statusLabelTh(status: string): string {
  const s = (status || "").toLowerCase();
  return BOOKING_STATUS_TH[s] ?? (status || "—");
}

function parsePayloadFallbacks(payload: Record<string, unknown>) {
  const trip = (payload.trip as Record<string, unknown> | undefined) ?? {};
  const customer = (payload.customer as Record<string, unknown> | undefined) ?? {};
  const booking = (payload.booking as Record<string, unknown> | undefined) ?? {};
  const gs = booking.group_size;
  const groupSize =
    typeof gs === "number"
      ? gs
      : typeof gs === "string"
        ? parseInt(gs, 10) || 0
        : 0;
  return {
    tripName: typeof trip.name === "string" ? trip.name : undefined,
    tripProvince: typeof trip.province === "string" ? trip.province : undefined,
    customerName: typeof customer.name === "string" ? customer.name : undefined,
    bookingStatus: typeof booking.status === "string" ? booking.status : undefined,
    groupSize,
    bookingTotal:
      booking.total_price != null ? String(booking.total_price) : undefined,
  };
}

export function parseApiNotification(row: ApiNotificationRow): EmployeeNotification {
  const payload = (row.payload ?? {}) as Record<string, unknown>;
  const fb = parsePayloadFallbacks(payload);

  const tripName = (row.trip_name || fb.tripName || "").trim() || "ทริป";
  const tripProvince = (row.trip_province || fb.tripProvince || "").trim();
  const customerName = (row.customer_name || fb.customerName || "").trim() || "ลูกค้า";
  const bookingStatus = (row.booking_status || fb.bookingStatus || "").trim();
  const groupSize =
    row.group_size != null && row.group_size !== ""
      ? Number(row.group_size)
      : fb.groupSize;
  const safeGroup = Number.isFinite(groupSize) ? groupSize : 0;
  const bookingTotal =
    row.booking_total != null && row.booking_total !== ""
      ? String(row.booking_total)
      : fb.bookingTotal ?? "0";

  const stLabel = statusLabelTh(bookingStatus);
  let totalNum = Number(bookingTotal);
  if (!Number.isFinite(totalNum)) totalNum = 0;
  const money = totalNum.toLocaleString("th-TH", { maximumFractionDigits: 0 });

  const detailLine = [
    `${customerName}`,
    `${safeGroup} คน`,
    stLabel,
    `รวม ${money} ฿`,
  ]
    .filter(Boolean)
    .join(" · ");

  const loc = tripProvince ? ` · ${tripProvince}` : "";

  return {
    id: row.id,
    read: row.read ?? Boolean(row.read_at),
    readAt: row.read_at,
    createdAt: row.created_at,
    type: "booking",
    tripName,
    tripProvince,
    customerName,
    bookingStatus,
    bookingTotal,
    groupSize: safeGroup,
    detailLine,
    title: `การจอง · ${tripName}${loc}`,
  };
}

function errorMessageForStatus(status: number): string {
  if (status === 401 || status === 403) {
    return "ยังไม่ได้ล็อกอินหรือไม่มีสิทธิ์พนักงาน — กรุณาเข้าสู่ระบบ";
  }
  return `โหลดการแจ้งเตือนไม่สำเร็จ (${status})`;
}

export function useEmployeeNotifications() {
  const [items, setItems] = useState<EmployeeNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  const load = useCallback(async () => {
    setFetchError(null);
    setLoading(true);
    try {
      const res = await apiFetch("/notifications/?page_size=100");
      if (res.status === 403 || res.status === 401) {
        setFetchError(errorMessageForStatus(res.status));
        setItems([]);
        return;
      }
      if (!res.ok) {
        setFetchError(errorMessageForStatus(res.status));
        setItems([]);
        return;
      }
      const data: unknown = await res.json();
      const list: ApiNotificationRow[] = Array.isArray(data)
        ? data
        : data &&
            typeof data === "object" &&
            "results" in data &&
            Array.isArray((data as { results: unknown }).results)
          ? (data as { results: ApiNotificationRow[] }).results
          : [];
      const parsed = list.map(parseApiNotification);

      const prevIds = prevIdsRef.current;
      const newOnes = parsed.filter((p) => !prevIds.has(p.id));
      prevIdsRef.current = new Set(parsed.map((p) => p.id));

      if (initialLoadDoneRef.current && newOnes.length > 0) {
        const newest = [...newOnes].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];
        playNotificationSound();
        showBookingNotificationToast({
          title: newest.title,
          detailLine: newest.detailLine,
        });
      }
      if (!initialLoadDoneRef.current) {
        initialLoadDoneRef.current = true;
      }

      setItems(parsed);
    } catch {
      setFetchError("เครือข่ายล้มหรือเซิร์ฟเวอร์ไม่ตอบสนอง");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onPush = () => {
      void load();
    };
    window.addEventListener(NOTIFICATION_EVENT, onPush);
    return () => window.removeEventListener(NOTIFICATION_EVENT, onPush);
  }, [load]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items],
  );

  const markAllRead = useCallback(async () => {
    try {
      const res = await apiFetch("/notifications/mark-all-read/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (res.ok) {
        await load();
        return;
      }
      if (res.status === 403 || res.status === 401) {
        setFetchError(errorMessageForStatus(res.status));
        return;
      }
      setFetchError(errorMessageForStatus(res.status));
    } catch {
      setFetchError("เครือข่ายล้มหรือเซิร์ฟเวอร์ไม่ตอบสนอง");
    }
  }, [load]);

  const bellAriaLabel =
    unreadCount > 0
      ? `การแจ้งเตือน ยังไม่ได้อ่าน ${unreadCount} รายการ`
      : "การแจ้งเตือน ไม่มีรายการที่ยังไม่ได้อ่าน";

  return {
    items,
    loading,
    fetchError,
    unreadCount,
    refetch: load,
    markAllRead,
    bellAriaLabel,
  };
}
