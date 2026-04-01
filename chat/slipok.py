"""
SlipOK API client — verify Thai payment slips (upload image).
https://api.slipok.com — POST /api/line/apikey/<BRANCH_ID>

สำคัญ: ตัวแปร SLIPOK_BRANCH_ID ต้องเป็น **รหัสสาขา (Branch ID)** จาก SlipOK dashboard
ที่ไปอยู่ใน URL ตัวนี้ — **ไม่ใช่** x-authorization (API key) และไม่ใช่ข้อความสุ่ม
ถ้าใส่ผิด จะได้ HTTP 422 + errors.param=id (เช่นข้อความทั่วไป "กรุณาใส่ข้อมูลให้ถูกต้อง")

Body ตามเอกสาร: ส่งอย่างใดอย่างหนึ่ง — data (QR string) | files (รูป) | url
เราใช้ multipart: files + log + amount (optional)
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from decimal import Decimal
from io import BytesIO
from typing import Any

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

SLIPOK_URL_TEMPLATE = "https://api.slipok.com/api/line/apikey/{branch_id}"


def _slip_print(msg: str) -> None:
    """พิมพ์ไป stdout ทันที — runserver เห็นแน่นอน (ไม่ผ่าน Django LOGGING)"""
    print(f"[SlipOK] {msg}", flush=True)


def _humanize_slipok_error_body(body: dict[str, Any]) -> str | None:
    """แปลงข้อความ error จาก SlipOK ให้เข้าใจง่าย (รหัสเฉพาะ / param id ฯลฯ)"""
    code_raw = body.get("code")
    if isinstance(code_raw, str) and code_raw.isdigit():
        code_raw = int(code_raw)
    if code_raw == 1014:
        return (
            "ผู้รับเงินบนสลิปไม่ตรงกับบัญชีหลักที่ตั้งในสาขา SlipOK — ไม่ใช่ bypass ในโค้ดได้ "
            "ให้ไปที่ SlipOK dashboard สาขานี้ แล้วตั้งบัญชีรับเงิน/พร้อมเพย์ให้เป็นตัวเดียวกับที่ลูกค้าโอนจริง "
            "(เลข PromptPay หรือเลขบัญชีธนาคาร + ชื่อบัญชี ต้องตรงกับที่ปรากฏบนสลิปและกับที่คุณให้ลูกค้าโอน)"
        )
    for err in body.get("errors") or []:
        if not isinstance(err, dict):
            continue
        if err.get("location") == "params" and err.get("param") == "id":
            return (
                "รหัสสาขา SlipOK ใน URL ไม่ถูกต้อง — ใส่ SLIPOK_BRANCH_ID ให้ตรง "
                "「เลขอ้างอิงสาขา」ใน SlipOK dashboard (ตัวเลข เช่น 62824) "
                "ไม่ใช่ API key และไม่ใช้ข้อความอื่นแทน — แก้ใน .env แล้วรีสตาร์ทเซิร์ฟเวอร์"
            )
    return None


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
    branch = (getattr(settings, "SLIPOK_BRANCH_ID", None) or "").strip()
    key = (getattr(settings, "SLIPOK_API_KEY", None) or "").strip()
    return bool(branch and key)


def verify_slip(
    image_bytes: bytes,
    *,
    expected_amount_baht: Decimal | float | int | None = None,
) -> SlipOkResult:
    """
    Upload slip image to SlipOK (multipart: files + log + optional amount).
    """
    branch_id = (getattr(settings, "SLIPOK_BRANCH_ID", None) or "").strip()
    api_key = (getattr(settings, "SLIPOK_API_KEY", None) or "").strip()
    if not branch_id or not api_key:
        _slip_print("skip: missing SLIPOK_BRANCH_ID or SLIPOK_API_KEY")
        logger.warning("[SlipOK] skip: missing SLIPOK_BRANCH_ID or SLIPOK_API_KEY")
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

    _slip_print(
        f"POST url={url} image_bytes={len(image_bytes)} file={fname} mime={mime} form_data={data}"
    )
    logger.info(
        "[SlipOK] POST url=%s image_bytes=%s file=%s content_type=%s form_data=%s",
        url,
        len(image_bytes),
        fname,
        mime,
        data,
    )

    try:
        with httpx.Client(timeout=90.0) as client:
            r = client.post(url, headers=headers, files=files, data=data)
    except httpx.RequestError as e:
        _slip_print(f"HTTP request failed: {e!r}")
        logger.exception("[SlipOK] request failed: %s", e)
        return SlipOkResult(
            ok=False,
            http_status=0,
            api_code=None,
            message="เชื่อมต่อบริการตรวจสลิปไม่สำเร็จ กรุณาลองใหม่ครับ",
            slip_amount=None,
            payload={},
        )

    raw_text = r.text
    _slip_print(f"response HTTP {r.status_code} len={len(raw_text)} preview={raw_text[:2000]!r}")
    logger.info(
        "[SlipOK] HTTP status=%s response_len=%s body_preview=%s",
        r.status_code,
        len(raw_text),
        raw_text[:4000],
    )

    try:
        body = r.json()
    except Exception:
        _slip_print(f"response is not JSON status={r.status_code} text={raw_text[:600]!r}")
        logger.warning(
            "[SlipOK] non-JSON response status=%s text=%s",
            r.status_code,
            raw_text[:800],
        )
        return SlipOkResult(
            ok=False,
            http_status=r.status_code,
            api_code=None,
            message="ระบบตรวจสลิปตอบกลับผิดรูปแบบ กรุณาลองใหม่ครับ",
            slip_amount=None,
            payload={},
        )

    try:
        body_json_preview = json.dumps(body, ensure_ascii=False)[:4000]
    except Exception:
        body_json_preview = str(body)[:4000]
    _slip_print(f"parsed JSON (truncated): {body_json_preview[:2500]}")
    logger.info("[SlipOK] parsed JSON preview=%s", body_json_preview)

    if r.status_code == 200 and body.get("success"):
        inner = body.get("data") or {}
        if inner.get("success"):
            amt = inner.get("amount")
            slip_amt = Decimal(str(amt)) if amt is not None else None
            _slip_print(
                f"RESULT ok=True slip_amount={slip_amt} inner_msg={(inner.get('message') or '')[:200]!r}"
            )
            logger.info(
                "[SlipOK] result branch=success ok=True slip_amount=%s inner_msg=%s",
                slip_amt,
                (inner.get("message") or "")[:200],
            )
            return SlipOkResult(
                ok=True,
                http_status=r.status_code,
                api_code=None,
                message=str(inner.get("message") or "✅"),
                slip_amount=slip_amt,
                payload=body,
            )
        inner_s = json.dumps(inner, ensure_ascii=False)[:1500]
        _slip_print(f"RESULT ok=False branch=200_but_inner_failed inner={inner_s}")
        logger.info("[SlipOK] result branch=200_but_inner_failed ok=False inner=%s", inner_s)
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
    hint = _humanize_slipok_error_body(body)
    if hint:
        msg = hint
        _slip_print(f"hint={hint!r}")
    inner = body.get("data") if isinstance(body.get("data"), dict) else {}
    amt = inner.get("amount")
    slip_amt = Decimal(str(amt)) if amt is not None else None

    _slip_print(
        f"RESULT ok=False branch=http_error http={r.status_code} api_code={api_code} "
        f"msg={msg[:300]!r} slip_amount={slip_amt}"
    )
    logger.info(
        "[SlipOK] result branch=http_error ok=False http=%s api_code=%s msg=%s slip_amount=%s",
        r.status_code,
        api_code,
        msg[:300],
        slip_amt,
    )

    return SlipOkResult(
        ok=False,
        http_status=r.status_code,
        api_code=api_code,
        message=msg,
        slip_amount=slip_amt,
        payload=body,
    )
