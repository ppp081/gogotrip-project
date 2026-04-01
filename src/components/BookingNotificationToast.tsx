import { toast } from "sonner";
import { CheckCheck, X } from "lucide-react";

export type BookingToastInput = {
  title: string;
  detailLine: string;
};

/**
 * Toast แบบ reference: การ์ดขาว มุมโค้ง, ไอคอนสี่เหลี่ยมสี mint + หัวข้อ + รายละเอียด (บรรทัดใหม่)
 */
export function showBookingNotificationToast(
  n: BookingToastInput,
  duration = 6000,
): void {
  const body = `รายละเอียดการจอง\n${n.detailLine}`;

  toast.custom(
    (id) => (
      <div
        role="status"
        className="pointer-events-auto flex w-[min(100vw-2rem,420px)] items-start gap-3 rounded-2xl border border-emerald-100/90 bg-white p-4 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.35)] ring-1 ring-emerald-500/[0.08]"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
          <CheckCheck className="h-6 w-6 text-white" strokeWidth={2.5} aria-hidden />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[15px] font-semibold leading-snug text-slate-900">
            {n.title}
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-500">
            {body}
          </p>
        </div>
        <button
          type="button"
          className="-m-1 shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="ปิดการแจ้งเตือน"
          onClick={() => toast.dismiss(id)}
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    ),
    { duration, unstyled: true },
  );
}
