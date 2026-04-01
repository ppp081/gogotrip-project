// src/employee_layout.tsx
import { useCallback, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  User,
  Map,
  Menu,
  Users,
  CalendarCheck,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { logoutRequest } from "@/api/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEmployeeNotifications } from "@/hooks/useEmployeeNotifications";
import { cn } from "@/lib/utils";

/** กระดิ่ง SVG (ไม่ใช้ emoji) — สีตาม hasUnread */
function HeaderBellIcon({
  className,
  hasUnread,
}: {
  className?: string;
  hasUnread: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "h-5 w-5 shrink-0 transition-colors",
        hasUnread ? "text-slate-900" : "text-slate-400",
        className,
      )}
      aria-hidden
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.29 21c.31.97 1.2 1.67 2.21 1.67 1.01 0 1.9-.7 2.21-1.67" />
    </svg>
  );
}

export type EmployeeSection = {
  key: string;
  label: string;
  icon: LucideIcon;
  path: string;
};

type EmployeeLayoutProps = {
  sections?: EmployeeSection[];
};

const FALLBACK_SECTIONS: EmployeeSection[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { key: "trips", label: "จัดการทริป", icon: Map, path: "/trips" },
  { key: "bookings", label: "การจองลูกค้า", icon: CalendarCheck, path: "/bookings" },
  { key: "customers", label: "ข้อมูลลูกค้า", icon: Users, path: "/customers" },
  { key: "ai-summary", label: "AI Insight", icon: Sparkles, path: "/summary" },
];

const isPathActive = (currentPath: string, targetPath: string) => {
  if (targetPath === "/") {
    return currentPath === "/";
  }
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
};

export default function EmployeeLayout({ sections }: EmployeeLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    items: notifications,
    loading: notificationsLoading,
    fetchError,
    unreadCount,
    markAllRead,
    bellAriaLabel,
    refetch: refetchNotifications,
  } = useEmployeeNotifications();

  const navItems = useMemo<EmployeeSection[]>(
    () => (sections && sections.length > 0 ? sections : FALLBACK_SECTIONS),
    [sections],
  );

  const activeSection = useMemo(
    () => navItems.find((item) => isPathActive(location.pathname, item.path)),
    [location.pathname, navItems],
  );

  const formatNotificationTime = useCallback((iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation overlay"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white p-6 shadow-lg transition-transform duration-200 ease-in-out md:static md:h-auto md:translate-x-0 md:shadow-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
      >
        <div className="flex items-center justify-between">
          <div className="text-blue-600">
            <span className="text-2xl font-semibold">GoGoTrip</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection?.key === item.key;
            return (
              <Link
                key={item.key}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${isActive
                  ? "bg-[#2563EB] text-white shadow-md"
                  : "text-[#4F6FB3] hover:bg-[#EEF3FF] hover:text-[#1E3A8A]"
                  }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${isActive ? "text-white" : "text-[#4F6FB3] group-hover:text-[#1E3A8A]"
                    }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-4">
            {fetchError ? (
              <p
                className="order-2 max-w-[min(100%,220px)] text-right text-xs leading-snug text-rose-600 sm:order-1"
                role="status"
              >
                {fetchError}
              </p>
            ) : null}
            <div className="order-1 flex items-center gap-2 sm:order-2 sm:gap-4">
            <DropdownMenu
              onOpenChange={(open) => {
                if (open) {
                  void markAllRead();
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={notificationsLoading}
                  className={cn(
                    "relative rounded-full p-2 transition-colors hover:bg-slate-100",
                    unreadCount > 0
                      ? "text-slate-900 ring-2 ring-blue-100"
                      : "text-slate-500 hover:text-slate-900",
                    notificationsLoading && "opacity-60",
                  )}
                  aria-label={bellAriaLabel}
                >
                  <HeaderBellIcon hasUnread={unreadCount > 0} />
                  {unreadCount > 0 ? (
                    <span className="absolute right-1 top-1 inline-flex min-h-[1.25rem] min-w-[1.25rem] -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-rose-500 px-1 text-[0.65rem] font-semibold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <DropdownMenuLabel className="flex items-center justify-between px-4 py-2 text-sm font-semibold text-slate-800">
                  การแจ้งเตือน
                  {notifications.length > 0 ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-blue-600 transition hover:text-blue-500"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        void markAllRead();
                      }}
                    >
                      ทำเครื่องหมายอ่านทั้งหมด
                    </button>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notificationsLoading && notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    กำลังโหลด…
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    ยังไม่มีการแจ้งเตือน
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className={`flex cursor-default items-start gap-3 px-4 py-3 text-left focus:bg-slate-100 ${
                            !notification.read ? "bg-slate-50" : ""
                          }`}
                          onSelect={(event) => event.preventDefault()}
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                            <CalendarCheck className="h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={`text-sm font-semibold ${
                                  !notification.read ? "text-slate-900" : "text-slate-600"
                                }`}
                              >
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                              )}
                            </div>
                            <p className="text-xs font-medium text-slate-700">
                              {notification.tripName}
                              {notification.tripProvince
                                ? ` · ${notification.tripProvince}`
                                : ""}
                            </p>
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {notification.detailLine}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {formatNotificationTime(notification.createdAt)}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      ))}
                  </div>
                )}
                {fetchError ? (
                  <div className="border-t border-slate-100 px-4 py-2">
                    <button
                      type="button"
                      className="text-xs font-medium text-blue-600 hover:text-blue-500"
                      onClick={() => void refetchNotifications()}
                    >
                      ลองโหลดใหม่
                    </button>
                  </div>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full bg-slate-200 p-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-300"
                  aria-label="บัญชีผู้ใช้"
                >
                  <User className="size-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 py-2">
                <DropdownMenuLabel className="text-sm font-semibold text-slate-900">
                  บัญชีผู้ใช้
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-rose-600 focus:text-rose-600"
                  onSelect={async () => {
                    try {
                      await logoutRequest();
                    } finally {
                      navigate("/signin", { replace: true });
                    }
                  }}
                >
                  ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
