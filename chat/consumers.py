import json
import logging
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings

logger = logging.getLogger(__name__)


def _expected_ws_token() -> str:
    return (getattr(settings, "ADMIN_WS_TOKEN", None) or "").strip()


class AdminNotificationConsumer(AsyncWebsocketConsumer):
    """
    React dashboard connects to ws://.../ws/admin/notifications/?token=<ADMIN_WS_TOKEN>
    Subscribes to the same group used by notify_booking_created().
    """

    group_name = "admin_notifications"

    async def connect(self):
        if not await self._authorized():
            await self.close(code=4401)
            return
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def _authorized(self) -> bool:
        qs = parse_qs(self.scope.get("query_string", b"").decode())
        token = (qs.get("token") or [None])[0] or ""
        expected = _expected_ws_token()
        if expected and token == expected:
            return True
        if settings.DEBUG and not expected:
            logger.warning("ADMIN_WS_TOKEN not set; allowing WebSocket in DEBUG only.")
            return True
        return False

    async def notification_event(self, event):
        await self.send(text_data=json.dumps(event["payload"], ensure_ascii=False))
