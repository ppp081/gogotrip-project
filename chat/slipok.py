"""
SlipOK API client — verify Thai payment slips (upload image).
https://api.slipok.com — POST /api/line/apikey/<branch_id>
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from decimal import Decimal
from io import BytesIO
from typing import Any

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

SLIPOK_URL_TEMPLATE = "https://api.slipok.com/api/line/apikey/{branch_id}"


def _guess_image_filename_and_content_type(data: bytes) -> tuple[str, str]:
    if data.startswith(b"\xff\xd8"):
        return "slip.jpg", "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "slip.png", "image/png"
    if data.startswith(b"RIFF") and len(data) >= 12 and data[8:12] == b"WEBP":
        return "slip.webp", "image/webp"
    return "slip.jpg", "image/jpeg"


@dataclass
class SlipOkResult:
    ok: bool
    http_status: int
    api_code: int | None
    message: str
    slip_amount: Decimal | None
    payload: dict[str, Any]


def slipok_is_configured() -> bool:
    branch = getattr(settings, "SLIPOK_BRANCH_ID", None)
    key = getattr(settings, "SLIPOK_API_KEY", None)
    return bool(branch and key)


def verify_slip_image_bytes(
    image_bytes: bytes,
    *,
    expected_amount_baht: Decimal | float | int | None = None,
) -> SlipOkResult:
    """
    Upload slip image to SlipOK (multipart: files + log + optional amount).
    """
    branch_id = getattr(settings, "SLIPOK_BRANCH_ID", None)
    api_key = getattr(settings, "SLIPOK_API_KEY", None)
    if not branch_id or not api_key:
        return SlipOkResult(
            ok=False,
            http_status=0,
            api_code=None,
            message="ยังไม่ได้ตั้งค่า SlipOK (SLIPOK_API_KEY / SLIPOK_BRANCH_ID)",
            slip_amount=None,
            payload={},
        )

    use_log = getattr(settings, "SLIPOK_LOG", True)
    url = SLIPOK_URL_TEMPLATE.format(branch_id=branch_id)
    headers = {"x-authorization": str(api_key)}

    fname, mime = _guess_image_filename_and_content_type(image_bytes)
    files = {"files": (fname, BytesIO(image_bytes), mime)}
    data: dict[str, str] = {"log": "true" if use_log else "false"}
    if expected_amount_baht is not None:
        # API accepts number; form fields are strings
        ea = Decimal(str(expected_amount_baht))
        data["amount"] = str(int(ea)) if ea == ea.to_integral_value() else str(ea)

    try:
        with httpx.Client(timeout=90.0) as client:
            r = client.post(url, headers=headers, files=files, data=data)
    except httpx.RequestError as e:
        logger.exception("SlipOK request failed: %s", e)
        return SlipOkResult(
            ok=False,
            http_status=0,
            api_code=None,
            message="เชื่อมต่อบริการตรวจสลิปไม่สำเร็จ กรุณาลองใหม่ครับ",
            slip_amount=None,
            payload={},
        )

    try:
        body = r.json()
    except Exception:
        logger.warning("SlipOK non-JSON response status=%s text=%s", r.status_code, r.text[:500])
        return SlipOkResult(
            ok=False,
            http_status=r.status_code,
            api_code=None,
            message="ระบบตรวจสลิปตอบกลับผิดรูปแบบ กรุณาลองใหม่ครับ",
            slip_amount=None,
            payload={},
        )

    if r.status_code == 200 and body.get("success"):
        inner = body.get("data") or {}
        if inner.get("success"):
            amt = inner.get("amount")
            slip_amt = Decimal(str(amt)) if amt is not None else None
            return SlipOkResult(
                ok=True,
                http_status=r.status_code,
                api_code=None,
                message=str(inner.get("message") or "✅"),
                slip_amount=slip_amt,
                payload=body,
            )
        return SlipOkResult(
            ok=False,
            http_status=r.status_code,
            api_code=None,
            message=str(inner.get("message") or "สลิปไม่ผ่านการตรวจสอบ"),
            slip_amount=None,
            payload=body,
        )

    # 4xx / 5xx — SlipOK returns { code, message, data? }
    _code_raw = body.get("code")
    if isinstance(_code_raw, int):
        api_code = _code_raw
    elif isinstance(_code_raw, str) and _code_raw.isdigit():
        api_code = int(_code_raw)
    else:
        api_code = None
    msg = str(body.get("message") or "ตรวจสอบสลิปไม่สำเร็จครับ")
    inner = body.get("data") if isinstance(body.get("data"), dict) else {}
    amt = inner.get("amount")
    slip_amt = Decimal(str(amt)) if amt is not None else None

    return SlipOkResult(
        ok=False,
        http_status=r.status_code,
        api_code=api_code,
        message=msg,
        slip_amount=slip_amt,
        payload=body,
    )
