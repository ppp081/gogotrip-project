import React, { useEffect, useState } from "react";
import { useEmployeeNotifications } from "./hooks/useEmployeeNotifications";

type EmployeeLayoutProps = {
  children: React.ReactNode;
  showNotificationBell?: boolean;
};

function formatThaiTime(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.1-1.6-5.6-4.5-6.3V4c0-.8-.7-1.5-1.5-1.5S11 3.2 11 4v.7C8.1 5.4 6.5 7.9 6.5 11v5L4 18.5V19h16v-.5L18 16v-5z"
        fill={active ? "#1a237e" : "#5c6478"}
      />
    </svg>
  );
}

/**
 * Layout พนักงาน — ประวัติแจ้งเตือนจาก API จริง (GET /api/notifications/) + WebSocket realtime
 *
 * .env: VITE_BACKEND_API (ลงท้าย /api), VITE_WS_TOKEN (= ADMIN_WS_TOKEN ใน backend)
 */
export function EmployeeLayout({ children, showNotificationBell = true }: EmployeeLayoutProps) {
  const [open, setOpen] = useState(false);
  const {
    rows,
    unreadCount,
    loading,
    fetchError,
    toast,
    markRead,
    loadHistory,
    requestNotificationPermission,
  } = useEmployeeNotifications(Boolean(showNotificationBell));

  useEffect(() => {
    if (open && showNotificationBell) {
      void loadHistory();
    }
  }, [open, showNotificationBell, loadHistory]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f6f7fb" }}>
      <header
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          background: "#fff",
          borderBottom: "1px solid #e8eaef",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 18, color: "#1a1d26" }}>GoGoTrip — Employee</div>

        {showNotificationBell && (
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
            {fetchError && (
              <span style={{ fontSize: 11, color: "#c62828", maxWidth: 120 }} title={fetchError}>
                {fetchError}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setOpen((o) => !o);
                if (typeof Notification !== "undefined" && Notification.permission === "default") {
                  void requestNotificationPermission();
                }
              }}
              style={{
                position: "relative",
                border: "1px solid #e0e4ec",
                background: open ? "#e8eaf6" : "#f7f8fc",
                borderRadius: 12,
                width: 44,
                height: 44,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label={`การแจ้งเตือน ยังไม่อ่าน ${unreadCount} รายการ`}
            >
              <BellIcon active={unreadCount > 0} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    background: "#e53935",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 52,
                  width: 400,
                  maxHeight: 480,
                  overflow: "auto",
                  background: "#fff",
                  borderRadius: 12,
                  boxShadow: "0 12px 40px rgba(0,0,0,.12)",
                  border: "1px solid #e8eaef",
                }}
              >
                <div
                  style={{
                    padding: "12px 14px",
                    fontWeight: 600,
                    borderBottom: "1px solid #eee",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>ประวัติการแจ้งเตือน (จากระบบ)</span>
                  {loading && <span style={{ fontSize: 12, color: "#888", fontWeight: 400 }}>กำลังโหลด…</span>}
                </div>
                {rows.length === 0 && !loading ? (
                  <div style={{ padding: 24, color: "#888", fontSize: 14 }}>ยังไม่มีการแจ้งเตือนการจอง</div>
                ) : (
                  rows.map((row) => {
                    const p = row.payload;
                    const unread = !row.read_at;
                    const title = row.trip_name || p.trip?.name || "ทริป";
                    const province = row.trip_province || p.trip?.province || "—";
                    const cust = row.customer_name || p.customer?.name || "—";
                    const total = row.booking_total ?? p.booking?.total_price ?? "—";
                    const people = row.group_size ?? p.booking?.group_size;
                    return (
                      <button
                        type="button"
                        key={row.id}
                        onClick={() => unread && markRead(row.id)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "12px 14px",
                          border: "none",
                          borderBottom: "1px solid #f0f0f0",
                          background: unread ? "#f5f8ff" : "#fafafa",
                          cursor: unread ? "pointer" : "default",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#222", flex: 1 }}>
                            {title}
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 6,
                              background: unread ? "#e53935" : "#9e9e9e",
                              color: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            {unread ? "ใหม่" : "อ่านแล้ว"}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                          {cust} · {province} · ฿{total}
                          {people != null ? ` · ${people} คน` : ""}
                          {row.booking_status ? ` · ${row.booking_status}` : ""}
                        </div>
                        <div style={{ fontSize: 11, color: "#999", marginTop: 6 }}>
                          แจ้งเตือน: {formatThaiTime(row.created_at)}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {toast && (
        <div
          style={{
            position: "fixed",
            top: 72,
            right: 24,
            zIndex: 100,
            background: "#1a237e",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,.2)",
            maxWidth: 360,
            fontSize: 14,
          }}
        >
          {toast}
        </div>
      )}

      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  );
}

export default EmployeeLayout;
