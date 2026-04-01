"""
Upload payment slip images to Supabase Storage (bucket from settings, e.g. app-object-storage).
Object path: payment/<payment_id>.png (Content-Type follows detected bytes: PNG/JPEG/WebP).

ถ้า Supabase ไม่ครบ — บันทึกใต้ MEDIA_ROOT/payment/<id>.<ext> และคืน URL แบบเต็มจาก
PUBLIC_BACKEND_URL หรือ LINE_CHANNEL_NGROK_BASE + MEDIA_URL (รองรับ dev ที่ยังไม่ใส่ service key).
"""
from __future__ import annotations

import logging
import uuid
from pathlib import Path
from typing import Tuple

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)


def supabase_storage_configured() -> bool:
    return bool(
        getattr(settings, "SUPABASE_URL", None)
        and getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", None)
        and getattr(settings, "SUPABASE_OBJECT_STORAGE", None)
    )


def _public_backend_base() -> str:
    """Base URL ที่ลูกค้า/ LINE เข้าถึงไฟล์ใน /media/ ได้ (ไม่มี trailing slash)."""
    for key in ("PUBLIC_BACKEND_URL", "LINE_CHANNEL_NGROK_BASE"):
        v = (getattr(settings, key, None) or "").strip().rstrip("/")
        if v:
            return v
    return ""


def _guess_ext_and_content_type(data: bytes) -> tuple[str, str]:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png", "image/png"
    if data.startswith(b"\xff\xd8"):
        return "jpg", "image/jpeg"
    if data.startswith(b"RIFF") and len(data) >= 12 and data[8:12] == b"WEBP":
        return "webp", "image/webp"
    return "png", "application/octet-stream"


def _save_slip_to_media_local(image_bytes: bytes, payment_id: uuid.UUID) -> Tuple[str | None, str | None]:
    """บันทึกสลิปลงดิสก์และคืน URL สาธารณะเมื่อตั้ง PUBLIC_BACKEND_URL หรือ LINE_CHANNEL_NGROK_BASE."""
    base = _public_backend_base()
    if not base:
        logger.warning(
            "Supabase Storage not configured and no PUBLIC_BACKEND_URL / LINE_CHANNEL_NGROK_BASE — "
            "cannot build payment_url; set SUPABASE_URL+SUPABASE_SERVICE_ROLE_KEY or a public backend base URL"
        )
        return None, None

    ext, _ = _guess_ext_and_content_type(image_bytes)
    rel = f"payment/{payment_id}.{ext}"
    root = Path(settings.MEDIA_ROOT)
    dest = root / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(image_bytes)

    media = settings.MEDIA_URL
    if not media.endswith("/"):
        media = media + "/"
    public_url = f"{base}{media}{rel}"
    logger.info("Payment slip saved locally | path=%s url=%s", rel, public_url[:120])
    return public_url, rel


def upload_payment_slip(image_bytes: bytes, payment_id: uuid.UUID) -> Tuple[str | None, str | None]:
    """
    อัปโหลดไป Supabase ถ้าตั้งค่าครบ; ไม่เช่นนั้นบันทึกใต้ MEDIA_ROOT และคืน URL แบบเต็ม
    (ต้องมี PUBLIC_BACKEND_URL หรือ LINE_CHANNEL_NGROK_BASE ให้สอดคล้องกับที่ serve /media/).
    """
    if not supabase_storage_configured():
        return _save_slip_to_media_local(image_bytes, payment_id)

    base = settings.SUPABASE_URL.rstrip("/")
    bucket = settings.SUPABASE_OBJECT_STORAGE
    key = settings.SUPABASE_SERVICE_ROLE_KEY
    pid = str(payment_id)
    ext, content_type = _guess_ext_and_content_type(image_bytes)
    # โปรดักชันต้องการ path: <bucket>/payment/<payment_id>.png
    object_path = f"payment/{pid}.png"
    if ext != "png":
        # ยังใช้นามสกุล .png ตาม path ที่กำหนด — ส่ง Content-Type ตามชนิดจริงของไฟล์
        pass
    upload_url = f"{base}/storage/v1/object/{bucket}/{object_path}"

    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "Content-Type": content_type,
        "x-upsert": "true",
    }

    try:
        with httpx.Client(timeout=120.0) as client:
            r = client.post(upload_url, headers=headers, content=image_bytes)
    except httpx.RequestError as e:
        logger.exception("Supabase upload request failed: %s", e)
        return _save_slip_to_media_local(image_bytes, payment_id)

    if r.status_code not in (200, 201):
        logger.error(
            "Supabase upload failed status=%s body=%s",
            r.status_code,
            (r.text or "")[:500],
        )
        return _save_slip_to_media_local(image_bytes, payment_id)

    public_url = f"{base}/storage/v1/object/public/{bucket}/{object_path}"
    return public_url, object_path
