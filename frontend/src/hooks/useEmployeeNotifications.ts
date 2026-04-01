import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl, getWsNotificationsUrl } from "../lib/apiBase";

export type NotificationPayload = {
  type: string;
  notification_id?: string;
  booking?: { id?: string; status?: string; group_size?: number; total_price?: string };
  trip?: { name?: string; province?: string; start_date?: string };
  customer?: { name?: string; phone?: string };
};

/** แถวจาก API จริง — รวมฟิลด์จาก model Notification + join Booking/Trip/User (serializer) */
export type NotificationRow = {
  id: string;
  payload: NotificationPayload;
  read_at: string | null;
  created_at: string;
  trip_name?: string;
  trip_province?: string;
  customer_name?: string;
  booking_status?: string;
  booking_total?: string;
  group_size?: number;
};

const RECONNECT_MS = 4000;
const POLL_MS = 30000;

function wsUrlFromApi(): string {
  return getWsNotificationsUrl();
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[2]) : "";
}

function apiFetch(path: string, init?: RequestInit) {
  const url = path.startsWith("http") ? path : apiUrl(path.replace(/^\//, ""));
  const method = (init?.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (method !== "GET" && method !== "HEAD") {
    const csrf = getCookie("csrftoken");
    if (csrf) headers["X-CSRFToken"] = csrf;
  }
  return fetch(url, {
    ...init,
    credentials: "include",
    headers,
  });
}

function parseNotificationList(data: unknown): NotificationRow[] {
  const list = Array.isArray(data) ? data : (data as { results?: unknown[] }).results || [];
  return list
    .map((row) => {
      const r = row as Record<string, unknown>;
      const bt = r.booking_total;
      return {
        id: String(r.id || ""),
        payload: (r.payload || {}) as NotificationPayload,
        read_at: r.read_at ? String(r.read_at) : null,
        created_at: String(r.created_at || ""),
        trip_name: r.trip_name != null ? String(r.trip_name) : undefined,
        trip_province: r.trip_province != null ? String(r.trip_province) : undefined,
        customer_name: r.customer_name != null ? String(r.customer_name) : undefined,
        booking_status: r.booking_status != null ? String(r.booking_status) : undefined,
        booking_total: bt != null ? String(bt) : undefined,
        group_size: typeof r.group_size === "number" ? r.group_size : undefined,
      };
    })
    .filter((x) => x.id);
}

/**
 * โหลดประวัติแจ้งเตือนจาก DB ผ่าน REST + realtime ด้วย WebSocket (polling สำรอง)
 */
export function useEmployeeNotifications(enabled: boolean) {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const seenWsIds = useRef<Set<string>>(new Set());

  const pushToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 5000);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification("GoGoTrip", { body: msg });
      } catch {
        /* ignore */
      }
    }
  }, []);

  const loadHistory = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const r = await apiFetch("notifications/?page_size=50");
      if (!r.ok) {
        setFetchError(r.status === 403 ? "กรุณาเข้าสู่ระบบพนักงาน" : `โหลดไม่สำเร็จ (${r.status})`);
        setLoading(false);
        return;
      }
      setFetchError(null);
      const data = await r.json();
      const parsed = parseNotificationList(data);
      setRows(parsed);
      setUnreadCount(parsed.filter((x) => !x.read_at).length);
    } catch {
      setFetchError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const markRead = useCallback(async (notificationPk: string) => {
    try {
      const r = await apiFetch(`notifications/${notificationPk}/mark_read/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!r.ok) return;
      const data = (await r.json()) as { read_at?: string };
      const readAt = data.read_at ? String(data.read_at) : new Date().toISOString();
      setRows((prev) =>
        prev.map((row) => (row.id === notificationPk ? { ...row, read_at: readAt } : row)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void loadHistory();
    const poll = window.setInterval(() => void loadHistory(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [enabled, loadHistory]);

  useEffect(() => {
    if (!enabled) return;

    const connect = () => {
      try {
        const url = wsUrlFromApi();
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data as string) as NotificationPayload;
            const nid = payload.notification_id || "";
            if (nid && seenWsIds.current.has(nid)) return;
            if (nid) seenWsIds.current.add(nid);

            const tripName = payload.trip?.name || "ทริป";
            const customer = payload.customer?.name || "ลูกค้า";
            pushToast(`จองใหม่: ${tripName} — ${customer}`);
            void loadHistory();
          } catch {
            /* ignore */
          }
        };

        ws.onclose = () => {
          wsRef.current = null;
          window.setTimeout(connect, RECONNECT_MS);
        };
        ws.onerror = () => {
          try {
            ws.close();
          } catch {
            /* ignore */
          }
        };
      } catch {
        window.setTimeout(connect, RECONNECT_MS);
      }
    };

    connect();
    return () => {
      try {
        wsRef.current?.close();
      } catch {
        /* ignore */
      }
      wsRef.current = null;
    };
  }, [enabled, pushToast, loadHistory]);

  return {
    rows,
    unreadCount,
    loading,
    fetchError,
    toast,
    setToast,
    markRead,
    loadHistory,
    requestNotificationPermission: () =>
      typeof Notification !== "undefined" ? Notification.requestPermission() : Promise.resolve("denied"),
  };
}
