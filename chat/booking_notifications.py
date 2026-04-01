"""
Persist booking alerts (PostgreSQL / Supabase) and push to Django Channels WebSocket group.
"""
from __future__ import annotations

import logging
from typing import Any

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings

from .models import Booking, Notification

logger = logging.getLogger(__name__)

ADMIN_GROUP = "admin_notifications"


def build_booking_notification_payload(booking: Booking) -> dict[str, Any]:
    """Snapshot booking + trip + customer + equipment lines for dashboards and WS clients."""
    booking = (
        Booking.objects.select_related("trip", "customer")
        .prefetch_related("bookingequipment_set__equipment")
        .get(pk=booking.pk)
    )
    trip = booking.trip
    cust = booking.customer
    equipment_lines: list[dict[str, Any]] = []
    for be in booking.bookingequipment_set.all():
        equipment_lines.append(
            {
                "equipment_id": str(be.equipment_id),
                "name": be.equipment.name,
                "quantity": be.quantity,
                "total_price": str(be.total_price),
            }
        )

    return {
        "type": "new_booking",
        "booking": {
            "id": str(booking.id),
            "status": booking.status,
            "group_size": booking.group_size,
            "total_price": str(booking.total_price),
            "created_at": booking.created_at.isoformat(),
        },
        "trip": {
            "id": str(trip.id),
            "name": trip.name,
            "province": trip.province,
            "description": (trip.description or "")[:800],
            "content": (trip.content or "")[:200] if trip.content else "",
            "category": trip.category,
            "location": trip.location,
            "country": trip.country,
            "price_per_person": str(trip.price_per_person),
            "capacity": trip.capacity,
            "start_date": trip.start_date.isoformat(),
            "end_date": trip.end_date.isoformat(),
            "is_active": getattr(trip, "is_active", True),
        },
        "customer": {
            "id": str(cust.id),
            "name": cust.name,
            "phone": cust.phone or "",
        },
        "equipment": equipment_lines,
    }


def notify_booking_created(booking: Booking) -> Notification | None:
    """
    Save a Notification row (same DB as Supabase Postgres when using Supabase) and
    broadcast to the admin WebSocket group.
    """
    if not getattr(settings, "BOOKING_NOTIFICATIONS_ENABLED", True):
        return None

    try:
        payload = build_booking_notification_payload(booking)
        notif = Notification.objects.create(booking=booking, payload=payload)
        payload["notification_id"] = str(notif.id)
        notif.payload = payload
        notif.save(update_fields=["payload"])
    except Exception as e:
        logger.exception("Failed to create Notification: %s", e)
        return None

    channel_layer = get_channel_layer()
    if not channel_layer:
        logger.warning("No channel layer configured; notification saved but not broadcast.")
        return notif

    try:
        async_to_sync(channel_layer.group_send)(
            ADMIN_GROUP,
            {
                "type": "notification_event",
                "payload": payload,
            },
        )
    except Exception as e:
        logger.exception("WebSocket broadcast failed: %s", e)

    return notif
