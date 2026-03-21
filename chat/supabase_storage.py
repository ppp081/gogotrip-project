"""
Upload payment slip images to Supabase Storage (bucket from settings).
Object path: payment/<payment_id>.<ext>
"""
from __future__ import annotations

import logging
import uuid
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


def _guess_ext_and_content_type(data: bytes) -> tuple[str, str]:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png", "image/png"
    if data.startswith(b"\xff\xd8"):
        return "jpg", "image/jpeg"
    if data.startswith(b"RIFF") and len(data) >= 12 and data[8:12] == b"WEBP":
        return "webp", "image/webp"
    return "png", "application/octet-stream"


def upload_payment_slip(image_bytes: bytes, payment_id: uuid.UUID) -> Tuple[str | None, str | None]:
    """
    PUT binary to Storage API. Returns (public_url, object_path) or (None, None) on failure.
    """
    if not supabase_storage_configured():
        logger.warning("Supabase Storage not configured; skip slip upload")
        return None, None

    base = settings.SUPABASE_URL.rstrip("/")
    bucket = settings.SUPABASE_OBJECT_STORAGE
    key = settings.SUPABASE_SERVICE_ROLE_KEY
    pid = str(payment_id)
    ext, content_type = _guess_ext_and_content_type(image_bytes)
    object_path = f"payment/{pid}.{ext}"
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
        return None, None

    if r.status_code not in (200, 201):
        logger.error(
            "Supabase upload failed status=%s body=%s",
            r.status_code,
            (r.text or "")[:500],
        )
        return None, None

    public_url = f"{base}/storage/v1/object/public/{bucket}/{object_path}"
    return public_url, object_path
