// src/employee_layout.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  LucideIcon,
  User,
  Map,
  Menu,
  Users,
  CalendarCheck,
  Bell,
  X,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NOTIFICATION_EVENT,
  type NotificationPayload,
} from "@/lib/notification-bus";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: NotificationPayload["type"];
  createdAt: string;
  read: boolean;
  link?: string;
};

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
];

const isPathActive = (currentPath: string, targetPath: string) => {
  if (targetPath === "/") {
    return currentPath === "/";
  }
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
};

export default function EmployeeLayout({ sections }: EmployeeLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const navItems = useMemo<EmployeeSection[]>(
    () => (sections && sections.length > 0 ? sections : FALLBACK_SECTIONS),
    [sections],
  );

  const activeSection = useMemo(
    () => navItems.find((item) => isPathActive(location.pathname, item.path)),
    [location.pathname, navItems],
  );

  const activeLabel = activeSection?.label ?? "Dashboard";
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    const handleNotification = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationPayload>;
      if (!customEvent.detail) {
        return;
      }

      const detail = customEvent.detail;
      const id = detail.id ?? crypto.randomUUID?.() ?? String(Date.now());
      const createdAt = detail.createdAt ?? new Date().toISOString();
      const type = detail.type ?? "info";

      setNotifications((prev) => {
        const next: NotificationItem[] = [
          {
            id,
            title: detail.title ?? (type === "booking" ? "การจองใหม่" : "การแจ้งเตือน"),
            message: detail.message,
            type,
            createdAt,
            read: false,
            link: detail.link,
          },
          ...prev,
        ];

        return next.slice(0, 20);
      });
    };

    window.addEventListener(NOTIFICATION_EVENT, handleNotification as EventListener);
    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, handleNotification as EventListener);
    };
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

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
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white p-6 shadow-lg transition-transform duration-200 ease-in-out md:static md:h-auto md:translate-x-0 md:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
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
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#2563EB] text-white shadow-md"
                    : "text-[#4F6FB3] hover:bg-[#EEF3FF] hover:text-[#1E3A8A]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive ? "text-white" : "text-[#4F6FB3] group-hover:text-[#1E3A8A]"
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
          <div className="ml-auto flex items-center gap-4">
            <DropdownMenu
              onOpenChange={(open) => {
                if (open) {
                  markAllAsRead();
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  aria-label="การแจ้งเตือน"
                >
                  <Bell className="h-5 w-5" />
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
                        clearNotifications();
                      }}
                    >
                      ล้างทั้งหมด
                    </button>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    ยังไม่มีการแจ้งเตือน
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex cursor-default items-start gap-2 px-4 py-3 text-left focus:bg-slate-100"
                        onSelect={(event) => event.preventDefault()}
                      >
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-700">
                            {notification.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatNotificationTime(notification.createdAt)}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full bg-slate-200  p-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-300"
                  aria-label="บัญชีผู้ใช้"
                >
                  <User className="size-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 py-2">
                <div className="px-3 pb-2 text-sm font-semibold text-slate-900">
                  บัญชีผู้ใช้
                </div>
                <DropdownMenuItem onSelect={() => {}}>
                  โปรไฟล์
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => {}}>
                  การตั้งค่า
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-rose-600 focus:text-rose-600"
                  onSelect={() => {}}
                >
                  ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
