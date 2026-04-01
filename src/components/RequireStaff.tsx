import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { meRequest } from "@/api/auth";

type State = "loading" | "ok" | "no";

/**
 * ห่อ route แดชบอร์ด — ต้อง login เป็น Django staff เท่านั้น
 */
export default function RequireStaff() {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    let cancelled = false;
    meRequest()
      .then((d) => {
        if (cancelled) return;
        if (d.authenticated && d.user?.is_staff) setState("ok");
        else setState("no");
      })
      .catch(() => {
        if (!cancelled) setState("no");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        กำลังตรวจสอบสิทธิ์…
      </div>
    );
  }
  if (state === "no") {
    return <Navigate to="/signin" replace />;
  }
  return <Outlet />;
}
