export const NOTIFICATION_EVENT = "app:notification";

export type NotificationPayload = {
  id?: string;
  title?: string;
  message: string;
  type?: "booking" | "info" | "warning";
  createdAt?: string;
  link?: string;
};

export const emitNotification = (payload: NotificationPayload) => {
  if (typeof window === "undefined") {
    return;
  }

  const detail = {
    ...payload,
    id: payload.id ?? crypto.randomUUID?.() ?? String(Date.now()),
    createdAt: payload.createdAt ?? new Date().toISOString(),
  };

  window.dispatchEvent(
    new CustomEvent<NotificationPayload>(NOTIFICATION_EVENT, { detail }),
  );
};

export const BOOKING_CREATED_EVENT = "app:booking-created";

export type BookingCreatedPayload = {
  id: number | string;
  customerName: string;
  trip: string;
  people: number;
  amount: number;
  bookingDate: string;
  paymentStatus?: "Paid" | "Pending" | "Due";
};

export const emitBookingCreated = (payload: BookingCreatedPayload) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<BookingCreatedPayload>(BOOKING_CREATED_EVENT, { detail: payload }),
  );

  emitNotification({
    type: "booking",
    title: "การจองใหม่",
    message: `มีลูกค้าจองทริปใหม่: ${payload.customerName} - ${payload.trip}`,
    createdAt: payload.bookingDate,
  });
};
