# tripbot/chat/line_webhook.py
"""
LINE Bot Webhook Handler
"""
from django.utils import formats
import logging
import traceback
import json
import base64
import re, json, decimal
import uuid
from decimal import Decimal
from datetime import datetime, timezone as dt_timezone
from django.utils import timezone as tz


from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError, LineBotApiError
from linebot.models import (
    MessageEvent, TextMessage, TextSendMessage, FlexSendMessage, PostbackEvent,
    ImageMessage, ImageSendMessage, PostbackAction, VideoMessage, AudioMessage, StickerMessage, LocationMessage, QuickReply, QuickReplyButton, MessageAction
)


# LLM Calling
from .agent import *
from .models import LineUser, LineMessage, User, Rating, Trip, Booking, Equipment
from .slipok import verify_slip, slipok_is_configured
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage


logger = logging.getLogger(__name__)


def _format_line_outgoing_for_debug(messages) -> str:
    """Human-readable debug dump for outbound LINE messages (Thai prints as Thai, not \\uXXXX)."""
    if not messages:
        return "(ว่าง)"
    lines: list[str] = []
    for i, m in enumerate(messages):
        if isinstance(m, TextSendMessage):
            lines.append(f"[{i}] ข้อความ:\n{m.text}")
        elif isinstance(m, FlexSendMessage):
            alt = getattr(m, "alt_text", "") or ""
            lines.append(f"[{i}] Flex (alt): {alt}")
        else:
            lines.append(f"[{i}] {type(m).__name__}")
    return "\n".join(lines)


# LINE Bot API setup
line_bot_api = LineBotApi(settings.LINE_CHANNEL_ACCESS_TOKEN)
handler = WebhookHandler(settings.LINE_CHANNEL_SECRET)


def _handle_feedback_phase1(line_user, reply_token, payload_str: str) -> None:
    """Parse feedback:like|dislike:trip_id[:booking_id], set user state, reply with quick replies."""
    parts = str(payload_str).strip().split(":")
    if len(parts) < 3:
        return
    rating_type = parts[1]
    trip_id = parts[2]
    booking_id = parts[3] if len(parts) >= 4 else None

    line_user.user_status = "waiting_for_reason"
    line_user.user_metadata = {
        "trip_id": trip_id,
        "rating_type": rating_type,
        "booking_id": booking_id,
    }
    line_user.save(update_fields=["user_status", "user_metadata"])

    if rating_type == "like":
        text_content = "ดีใจที่ประทับใจครับ 😊\nเลือกสิ่งที่ชอบที่สุดได้เลยครับ"
        quick_reply = QuickReply(
            items=[
                QuickReplyButton(action=MessageAction(label="🧑‍✈️ ไกด์ดูแลดี", text="ไกด์ดูแลดี")),
                QuickReplyButton(action=MessageAction(label="📋 โปรแกรมจัดดี", text="โปรแกรมจัดดี")),
                QuickReplyButton(action=MessageAction(label="🏨 ที่พักสบาย", text="ที่พักสบาย")),
                QuickReplyButton(action=MessageAction(label="🌿 บรรยากาศดี", text="บรรยากาศดี")),
            ]
        )
    else:
        text_content = "เราเสียใจที่ทริปนี้ยังไม่ตรงใจครับ 🙏\nช่วยบอกเราหน่อยนะครับว่าเรื่องไหนที่ควรปรับปรุง"
        quick_reply = QuickReply(
            items=[
                QuickReplyButton(action=MessageAction(label="🧑‍✈️ ไกด์ไม่สุภาพ", text="ไกด์ไม่สุภาพ")),
                QuickReplyButton(action=MessageAction(label="🏨 ที่พักไม่ตรงปก", text="ที่พักไม่ตรงปก")),
                QuickReplyButton(action=MessageAction(label="🍽️ อาหารไม่ถูกปาก", text="อาหารไม่ถูกปาก")),
                QuickReplyButton(action=MessageAction(label="📋 โปรแกรมไม่น่าสนใจ", text="โปรแกรมไม่น่าสนใจ")),
            ]
        )

    line_bot_api.reply_message(
        reply_token,
        TextSendMessage(text=text_content, quick_reply=quick_reply),
    )


def _service_rating_quick_reply() -> QuickReply:
    """Quick reply 1–5 ดาวสำหรับคะแนนการบริการ (postback เพื่อไม่โชว์ payload ในแชท)"""
    items = []
    for n in range(1, 6):
        items.append(
            QuickReplyButton(
                action=PostbackAction(
                    label=f"{n}⭐",
                    data=f"servicerate:{n}",
                    display_text=f"ให้คะแนน {n} ดาว🌟",
                )
            )
        )
    return QuickReply(items=items)


def _apply_service_rating(line_user, reply_token, stars: int) -> None:
    """สร้าง Rating หลังผู้ใช้เลือกคะแนนการบริการ 1–5 (ข้อมูลค้างจาก user_metadata)"""
    md = line_user.user_metadata or {}
    trip_id = md.get("trip_id")
    booking_raw = md.get("booking_id")
    comment = md.get("comment") or ""

    if not trip_id:
        logger.warning("Service rating: missing trip_id in metadata")
        line_user.user_status = "idle"
        line_user.user_metadata = {}
        line_user.save(update_fields=["user_status", "user_metadata"])
        line_bot_api.reply_message(
            reply_token,
            TextSendMessage(text="ขออภัยครับ ไม่พบข้อมูลการให้คะแนน กรุณาเริ่มจากขั้นตอน feedback ใหม่นะครับ 🙏"),
        )
        return

    booking_id = None
    if booking_raw not in (None, ""):
        try:
            booking_id = uuid.UUID(str(booking_raw))
        except (ValueError, TypeError):
            booking_id = None

    try:
        trip = Trip.objects.get(id=trip_id)
        Rating.objects.create(
            trip=trip,
            user=line_user.user,
            booking_id=booking_id,
            service_rating=stars,
            comment=comment,
        )
        logger.info(
            f"Rating saved trip={trip_id} booking={booking_id} service_rating={stars} user={line_user.user}"
        )
    except Exception as e:
        logger.error(f"Error saving Rating (service_rating): {e}")
        line_bot_api.reply_message(
            reply_token,
            TextSendMessage(
                text="ขออภัยครับ ระบบบันทึกคะแนนไม่สำเร็จ กรุณาลองใหม่อีกครั้งหรือติดต่อทีมงานนะครับ 🙏"
            ),
        )
        return

    line_user.user_status = "idle"
    line_user.user_metadata = {}
    line_user.save(update_fields=["user_status", "user_metadata"])

    line_bot_api.reply_message(
        reply_token,
        TextSendMessage(
            text=(
                "ขอบคุณสำหรับคะแนนการบริการครับ 🌟\n"
                "ความเห็นของคุณช่วยให้เราพัฒนาประสบการณ์ให้ดียิ่งขึ้น\n"
                "แล้วพบกันใหม่ในทริปหน้านะครับ ✨"
            )
        ),
    )


@csrf_exempt
@require_POST
def line_webhook(request):
    """LINE Webhook endpoint"""
    signature = request.META.get('HTTP_X_LINE_SIGNATURE')
    body = request.body.decode('utf-8')
    logger.info(f"Received webhook: {body}")
    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        logger.error("Invalid signature. Please check your channel access token/channel secret.")
        return HttpResponseBadRequest("Invalid signature")
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return HttpResponseBadRequest(f"Error: {str(e)}")
    
    return HttpResponse("OK")

@handler.add(MessageEvent, message=TextMessage)
def handle_text_message(event):
    """Handle text messages from LINE"""
    try:
        # ดึงข้อมูลลูกค้า
        line_user   = get_or_create_line_user(event.source.user_id)
        user_status = getattr(line_user, "user_status", "")
        profile = line_bot_api.get_profile(event.source.user_id)
        print("Display Name:", profile.display_name)
        print("User ID:", profile.user_id)
        print("Picture URL:", profile.picture_url)
        print("Status Message:", profile.status_message)
        
        # บันทึก ข้อความใหม่
        incoming_message = LineMessage.objects.create(
            line_user=line_user,
            message_id=getattr(event.message, "id", "") or "",
            message_type=LineMessage.MessageType.TEXT,
            direction=LineMessage.Direction.INCOMING,
            content=(event.message.text or "").strip(),
            reply_token=event.reply_token,
            timestamp=datetime.fromtimestamp(event.timestamp / 1000, tz=dt_timezone.utc),
            processed=False,
        )
        logger.error(f"Received message from {line_user.display_name}: {incoming_message.content}")
        

        # ตรวจสอบสถานะ
        
        # จัดการ Phase 1 (เข้าสู่โหมดให้คะแนน)
        if str(incoming_message.content).startswith("feedback:"):
            _handle_feedback_phase1(line_user, event.reply_token, incoming_message.content)
            return

        # Phase 3b: รอคะแนนการบริการ 1–5 ดาว
        if user_status == "waiting_for_service_rating":
            content = str(incoming_message.content).strip()
            if content.isdigit() and 1 <= int(content) <= 5:
                _apply_service_rating(line_user, event.reply_token, int(content))
                return
            line_bot_api.reply_message(
                event.reply_token,
                TextSendMessage(text="กรุณาเลือกคะแนน 1–5 ดาวจากปุ่มด้านล่างนะครับ 🙏"),
            )
            return

        # Phase 2: รับเหตุผลแล้วถามความเห็นเพิ่มเติม
        if user_status == "waiting_for_reason":
            content = str(incoming_message.content)
            user_metadata = line_user.user_metadata or {}
            
            reason = content
            user_metadata["reason"] = reason
            user_metadata["comments"] = []
            
            line_user.user_status = "giving_feedback"
            line_user.user_metadata = user_metadata
            line_user.save(update_fields=["user_status", "user_metadata"])
            
            quick_reply = QuickReply(items=[
                QuickReplyButton(action=MessageAction(label="✅ ส่งความเห็น", text="ส่งความเห็น")),
                QuickReplyButton(action=MessageAction(label="❌ ไม่ส่งความเห็น", text="ไม่ส่งความเห็น"))
            ])
            line_bot_api.reply_message(
                event.reply_token,
                TextSendMessage(
                    text=f"ขอบคุณที่เลือก '{reason}' ครับ ✨\nหากมีรายละเอียดเพิ่มเติม พิมพ์บอกเราได้เลย\nพร้อมแล้วกด 'ส่งความเห็น' ได้เลยครับ",
                    quick_reply=quick_reply
                )
            )
            return
        
        # Phase 3: รับ Comment หรือยืนยัน
        if user_status == "giving_feedback":
            content = str(incoming_message.content)
            user_metadata = line_user.user_metadata or {}
            
            if content == "ส่งความเห็น" or content == "ไม่ส่งความเห็น":
                trip_id = user_metadata.get("trip_id")
                rating_type = user_metadata.get("rating_type")
                reason = user_metadata.get("reason", "")
                comments = user_metadata.get("comments", [])
                booking_id = user_metadata.get("booking_id")

                if content == "ส่งความเห็น" and comments:
                    final_comment = "\n".join(comments) + f"\n[หมวดหมู่: {reason}]"
                else:
                    final_comment = f"[หมวดหมู่: {reason}]"

                line_user.user_status = "waiting_for_service_rating"
                line_user.user_metadata = {
                    "trip_id": str(trip_id) if trip_id else None,
                    "booking_id": str(booking_id) if booking_id else None,
                    "comment": final_comment,
                    "rating_type": rating_type,
                }
                line_user.save(update_fields=["user_status", "user_metadata"])

                thank_you = (
                    "ขอบคุณที่แบ่งปันความเห็นให้เรานะครับ 🙏\n"
                    "ทุกความคิดเห็นช่วยให้ GoGoTrip พัฒนาประสบการณ์ให้ดียิ่งขึ้น\n\n"
                    "ช่วยให้คะแนนการบริการของเราในครั้งนี้หน่อยได้ไหมครับ?\n"
                    "(เลือก 1–5 ดาวจากปุ่มด้านล่างได้เลยครับ)"
                )
                line_bot_api.reply_message(
                    event.reply_token,
                    TextSendMessage(text=thank_you, quick_reply=_service_rating_quick_reply()),
                )
                return
            else:
                # User typed free-text comment — collect silently
                comments = user_metadata.get("comments", [])
                comments.append(content)
                user_metadata["comments"] = comments
                line_user.user_metadata = user_metadata
                line_user.save(update_fields=["user_metadata"])
                
                quick_reply = QuickReply(items=[
                    QuickReplyButton(action=MessageAction(label="✅ ส่งความเห็น", text="ส่งความเห็น")),
                    QuickReplyButton(action=MessageAction(label="❌ ไม่ส่งความเห็น", text="ไม่ส่งความเห็น"))
                ])
                line_bot_api.reply_message(
                    event.reply_token,
                    TextSendMessage(
                        text="ได้รับแล้วครับ 📝 พิมพ์เพิ่มได้เรื่อย ๆ เลย\nพร้อมแล้วกดปุ่มด้านล่างได้เลยครับ",
                        quick_reply=quick_reply
                    )
                )
                return

        # กำลังจอง
        if user_status == "pending_payment":
            content_trim = (incoming_message.content or "").strip()
            if content_trim == "ยกเลิก":
                line_user.user_status = "idle"
                line_user.user_metadata = {}
                line_user.save(update_fields=["user_status", "user_metadata"])
                reply_text = (
                    "❌ ระบบได้ยกเลิกการชำระเงินเดิมให้เรียบร้อยแล้วครับ\n"
                    "หากต้องการจองทริปใหม่ หรือต้องการสอบถามข้อมูลเพิ่มเติม "
                    "สามารถพิมพ์ข้อความเข้ามาได้เลยครับ 🌿"
                )
            elif content_trim == "ชำระเงิน":
                reply_text = build_pending_payment_detail_text(line_user)
            else:
                reply_text = (
                    "🔔 ขณะนี้คุณกำลังอยู่ในขั้นตอนการชำระเงินครับ\n"
                    "หากต้องการอัปโหลดสลิปใหม่ สามารถส่งรูปเข้ามาได้เลย\n\n"
                    "หากต้องการยกเลิก หรือเริ่มจองทริปใหม่ พิมพ์คำว่า “ยกเลิก” ได้เลยครับ 🌿\n\n"
                    "หากต้องการดูรายละเอียดการชำระเงิน (ยอดรวม ข้อมูลจอง) "
                    "พิมพ์คำว่า \"ชำระเงิน\" ระบบจะส่งรายละเอียดให้อัตโนมัติครับ 💬"
                )

            if content_trim == "ชำระเงิน":
                qr = _promptpay_qr_url()
                outbound = [TextSendMessage(text=reply_text), ImageSendMessage(original_content_url=qr, preview_image_url=qr)]
                line_bot_api.reply_message(event.reply_token, outbound)
                LineMessage.objects.create(
                    line_user=line_user,
                    message_id=f"reply_{incoming_message.id}",
                    message_type=LineMessage.MessageType.TEXT,
                    direction=LineMessage.Direction.OUTGOING,
                    content=reply_text,
                    timestamp=tz.now(),
                    processed=True,
                )
                LineMessage.objects.create(
                    line_user=line_user,
                    message_id=f"reply_{incoming_message.id}_promptpay_qr",
                    message_type=LineMessage.MessageType.IMAGE,
                    direction=LineMessage.Direction.OUTGOING,
                    content=qr,
                    timestamp=tz.now(),
                    processed=True,
                )
            else:
                line_bot_api.reply_message(
                    event.reply_token,
                    TextSendMessage(text=reply_text),
                )
                LineMessage.objects.create(
                    line_user=line_user,
                    message_id=f"reply_{incoming_message.id}",
                    message_type=LineMessage.MessageType.TEXT,
                    direction=LineMessage.Direction.OUTGOING,
                    content=reply_text,
                    timestamp=tz.now(),
                    processed=True,
                )
            return
        else:
            if incoming_message.content == "เริ่มการติดต่อเจ้าหน้าที่และสนทนา":
                reply_text = (
                    "ยินดีต้อนรับสู่ GoGoTrip Customer Service\n"
                    "คุณลูกค้าสามารถติดต่อทีมงานทางโทรศัพท์โดยเร็วที่สุด\n"
                    "หากต้องการติดต่อด่วน:\n"
                    "\n"
                    "📞 099-123-4567\n"
                    "✉️ support@gogotrip.co.th"
                )
                line_bot_api.reply_message(
                    event.reply_token,
                    TextSendMessage(text=reply_text)
                )
                return
            else:
                # Get Message History
                try:
                    history = get_chat_history(line_user, limit=6)
                    result  = run_agent(incoming_message.content, history, line_user)

                except Exception as ai_error:
                    logger.error(f"AI processing error: {ai_error}")
                    result = {
                        "response_type": "error",
                        "response_content": "ขออภัยครับ เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง",
                        "response_meta": {}
                    }
                # Setup Variable
                response_type    = result.get("response_type",      "text")
                response_content = result.get("response_content",   "ขออภัยครับ ระบบยังไม่พบข้อมูลที่จะแสดง")
                response_meta    = result.get("response_meta",      {})
                messages         = []

                # Booking Verfify (Flex)
                if response_type == "booking_verify" and response_meta:
                    # Save metadata for later postback
                    line_user.user_metadata = response_meta
                    line_user.save(update_fields=["user_metadata"])
                    flex_payload = build_booking_verify_flex(response_meta)
                    messages.append(FlexSendMessage(
                        alt_text="ยืนยันรายละเอียดการจองทริป",
                        contents=flex_payload
                    ))

                # Trip List (Flex)
                if response_type == "trip_list" and response_meta:
                    flex_payload = build_trip_carousel_flex(response_meta)
                    messages.append(FlexSendMessage(
                        alt_text="พบทริปที่ตรงกับความต้องการ",
                        contents=flex_payload
                    ))
                # Text Message
                if response_content and response_content.strip():
                    messages.append(TextSendMessage(text=response_content))
                    print(f"[DEBUG] ข้อความที่จะส่ง ({len(messages)} ข้อความ):\n{_format_line_outgoing_for_debug(messages)}\n")

                # FallBack Message
                if not messages:
                    messages = [TextSendMessage(text="ขออภัยครับ ระบบยังไม่สามารถตอบได้ในตอนนี้")]

        # บันทึกข้อความขาออก
        if messages:
            # ตอบกลับข้อความผ่าน
            line_bot_api.reply_message(event.reply_token, messages)
            
            # บันทึกข้อความตอบกลับ
            LineMessage.objects.create(
                line_user    = line_user,
                message_id   = f"reply_{incoming_message.id}",
                message_type = LineMessage.MessageType.TEXT,
                direction    = LineMessage.Direction.OUTGOING,
                content = (
                    str(response_content)
                    if not response_meta
                    else f"{response_content}\n\n[__META_JSON__]{json.dumps(response_meta, ensure_ascii=False)}[__META_JSON__]"
                ),
                timestamp=tz.now(),
                processed=True,
            )

            # incoming_message.ai_response = str(response_content)
            # incoming_message.processed   = True
            # incoming_message.save(update_fields=["ai_response", "processed"])
            logger.info(f"Sent AI response to {line_user.display_name}")



    except Exception as e:
        logger.error(f"Error handling text message: {e}")
        traceback.print_exc()

@handler.add(MessageEvent, message=ImageMessage)
def handle_image_message(event):
    try:
        user_id = event.source.user_id
        line_user = get_or_create_line_user(user_id)
        user_status = line_user.user_status or "idle"
        print(f"[DEBUG]: {user_status}")

        # ---------- Core Behavior ----------
        if user_status == "pending_payment":
            b64 = imageBase64(event)
            if not b64:
                line_bot_api.reply_message(
                    event.reply_token,
                    TextSendMessage(text="ไม่สามารถดึงรูปสลิปได้ครับ กรุณาส่งรูปใหม่อีกครั้ง 🙏"),
                )
                return

            try:
                raw_bytes = base64.b64decode(b64)
            except Exception:
                line_bot_api.reply_message(
                    event.reply_token,
                    TextSendMessage(text="ไม่สามารถดึงรูปสลิปได้ครับ ไฟล์สลิปไม่ถูกต้องกรุณาส่งสลิปเป็น JPG/PNG ที่ชัด ๆ อีกครั้งครับ"),
                )
                return

            # --- เดิม: ใช้ AI ตรวจสลิป (payment_verify_agent) — เก็บไว้อ้างอิง ---
            # agent_response = payment_verify_agent(user_id=user_id, user_slip_b64=image)
            # if "confirm" in agent_response: ...

            if not slipok_is_configured():
                logger.error("SlipOK missing SLIPOK_API_KEY or SLIPOK_BRANCH_ID")
                line_bot_api.reply_message(
                    event.reply_token,
                    TextSendMessage(
                        text="ระบบตรวจสลิปยังไม่พร้อม (ตั้งค่า SlipOK ไม่ครบ) รบกวนติดต่อทีมงานชั่วคราวครับ 🙏"
                    ),
                )
                return

            # ยอดเดียวจากคำสั่งจอง — ใช้ทั้งแสดงให้ลูกค้าและส่งให้ SlipOK เทียบ
            payment_detail = _pending_payment_breakdown(line_user)
            # expected_amount_baht = payment_detail["grand_total"] if payment_detail else None
            expected_amount_baht = 1

            slip_verification = verify_slip(
                raw_bytes, expected_amount_baht=expected_amount_baht
            )
            try:
                payload_preview = json.dumps(slip_verification.payload or {}, ensure_ascii=False)[:1200]
            except Exception:
                payload_preview = str(slip_verification.payload)[:1200]
            logger.info(
                "[slip_verify] line_user_id=%s image_bytes=%s expected_amount_baht=%s "
                "ok=%s http=%s api_code=%s slip_amount=%s",
                user_id,
                len(raw_bytes),
                expected_amount_baht,
                slip_verification.ok,
                slip_verification.http_status,
                slip_verification.api_code,
                slip_verification.slip_amount,
            )
            logger.info(
                "[slip_verify] message=%s",
                (slip_verification.message or "")[:300],
            )
            logger.info("[slip_verify] payload=%s", payload_preview)

            if slip_verification.ok:
                meta = line_user.user_metadata or {}
                booking, payment, confirm_meta = create_booking_and_payment(
                    line_user,
                    meta,
                    slip_ok_payload=slip_verification.payload,
                    slip_image_bytes=raw_bytes,
                )
                flex_payload = booking_confirm_flex(confirm_meta)
                line_bot_api.reply_message(
                    event.reply_token,
                    [
                        FlexSendMessage(
                            alt_text="Booking Confirmed",
                            contents=flex_payload,
                        ),
                        TextSendMessage(
                            text=(
                                "🎉 ยืนยันการชำระเงินเรียบร้อยครับ!\n\n"
                                f"• ทริป: {confirm_meta['trip_name']}\n"
                                f"• จังหวัด: {confirm_meta['trip_province']}\n"
                                f"• วันที่เดินทาง: {confirm_meta['trip_date']}\n"
                                f"• เวลา: {confirm_meta['trip_time']}\n"
                                f"• จำนวนผู้เดินทาง: {confirm_meta['booking_person_count']} คน\n"
                                f"• ยอดรวมทั้งหมด: {confirm_meta['trip_total_price']} บาท 💰\n\n"
                                "ขอบคุณที่เลือกเดินทางกับเรา #GoGoTrip 🌿\n"
                                "ขอให้คุณมีทริปที่เต็มไปด้วยรอยยิ้มและความทรงจำดี ๆ ครับ 😊"
                            )
                        ),
                    ],
                )
                line_user.user_status = "idle"
                line_user.user_metadata = {}
                line_user.save(update_fields=["user_status", "user_metadata"])
            else:
                if expected_amount_baht is not None:
                    amount_line = f"ยอดที่ต้องชำระ (จากระบบจอง): {int(expected_amount_baht):,} บาท"
                else:
                    amount_line = (
                        "ยอดที่ต้องชำระ: — (ไม่พบยอดในระบบ — พิมพ์ «ชำระเงิน» เพื่อดูรายละเอียด)"
                    )
                if slip_verification.slip_amount is not None:
                    slip_line = f"ยอดบนสลิป (จาก SlipOK): {int(slip_verification.slip_amount):,} บาท"
                else:
                    slip_line = (
                        "ยอดบนสลิป (จาก SlipOK): — "
                        "(ยังอ่านยอดไม่ได้ — ลองส่งสลิปเต็ม ชัด ๆ หรือสลิปโอนจริง)"
                    )
                reply_text = (
                    f"❌ {slip_verification.message}\n\n"
                    "📋 รายละเอียดการชำระ:\n"
                    f"{amount_line}\n"
                    f"{slip_line}\n\n"
                    "กรุณาตรวจสอบยอดให้ตรงกัน แล้วส่งภาพสลิปการโอนใหม่ให้ชัดเจนอีกครั้งครับ 🙏"
                )
                line_bot_api.reply_message(
                    event.reply_token,
                    TextSendMessage(text=reply_text),
                )
            return

    except Exception as e:
        logger.exception("Error in handle_image_message: %s", e)


@handler.add(MessageEvent, message=StickerMessage)
def handle_sticker_message(event):
    """Handle sticker messages"""
    try:
        line_user = get_or_create_line_user(event.source.user_id)
        
        # Save sticker message
        LineMessage.objects.create(
            line_user=line_user,
            message_id=event.message.id,
            message_type=LineMessage.MessageType.STICKER,
            direction=LineMessage.Direction.INCOMING,
            content=f"Sticker (Package: {event.message.package_id}, ID: {event.message.sticker_id})",
            reply_token=event.reply_token,
            timestamp = datetime.fromtimestamp(event.timestamp / 1000, tz=dt_timezone.utc)
        )
        
        # Reply with friendly message
        reply_text = "😊 สวัสดีครับ! มีอะไรให้ช่วยเหลือเกี่ยวกับการท่องเที่ยวไหมครับ?"
        line_bot_api.reply_message(
            event.reply_token,
            TextSendMessage(text=reply_text)
        )
        
    except Exception as e:
        logger.error(f"Error handling sticker message: {str(e)}")

@handler.add(PostbackEvent)
def handle_postback(event):
    data = event.postback.data
    line_user = get_or_create_line_user(event.source.user_id)

    if data.startswith("feedback:"):
        _handle_feedback_phase1(line_user, event.reply_token, data)
        return

    if data.startswith("servicerate:"):
        parts = data.split(":")
        if len(parts) >= 2 and parts[1].isdigit():
            stars = int(parts[1])
            if 1 <= stars <= 5 and getattr(line_user, "user_status", "") == "waiting_for_service_rating":
                _apply_service_rating(line_user, event.reply_token, stars)
            elif 1 <= stars <= 5:
                line_bot_api.reply_message(
                    event.reply_token,
                    TextSendMessage(text="ขอบคุณครับ ตอนนี้ไม่ได้อยู่ในขั้นตอนให้คะแนนนะครับ 🙏"),
                )
        return

    params = dict(item.split("=") for item in data.split("&"))
    action = params.get("action")

    print("[DEBUG]: postback action", action)

    # # --- เรียก agent ตาม action ---
    if action == "trip_detail":
        trip_id = params.get("trip_id")
        logger.info(f"[Postback] trip_detail → {trip_id}")

        # เรียก agent สรุปข้อมูลทริป
        response_content = trip_detail_agent(trip_id)

        # เตรียมข้อความตอบกลับ
        messages = TextSendMessage(text=response_content)

        # ส่งกลับไปยังผู้ใช้
        line_bot_api.reply_message(event.reply_token, messages)

        # บันทึกข้อความขาออก
        LineMessage.objects.create(
            line_user=line_user,
            message_id=f"reply_postback_{trip_id}_{datetime.now().timestamp()}",
            message_type=LineMessage.MessageType.TEXT,
            direction=LineMessage.Direction.OUTGOING,
            content=str(response_content),
            timestamp=tz.now(),
            processed=True,
        )
        logger.info(f"✅ Sent AI response for trip_id={trip_id} to {line_user.display_name}")
        return
    
    elif action == "trip_interest":
        trip_id   = params.get("trip_id")
        trip_name = params.get("trip_name")
        trip_date = params.get("trip_date")
        trip_price_per_person = params.get("trip_price_per_person")

        # เตรียมข้อความตอบกลับ
        response_content = (
            f"🌿 เยี่ยมเลยครับ! ✨\n"
            f"ทริปที่คุณสนใจคือ {trip_name}\n\n"
            f"📅 วันที่เดินทาง: {trip_date}\n"
            f"💰 ราคาเพียง {trip_price_per_person} บาท/คน เท่านั้น!\n\n"
            "🌈 ทางเรามีอุปกรณ์เสริมให้เลือก หากอยากเพิ่มความสนุกระหว่างทริป\n"
            "▪️ ถุงนอน — 600 บาท\n"
            "▪️ เต็นท์ 2 คน — 1,500 \n"
            "▪️ ร่มกันแดด — 250\n\n"
        
            "📩 แจ้งจำนวนผู้เดินทางได้เลยครับ\n"
            "เพื่อความรวดเร็วในการจอง รบกวนแจ้งข้อมูลต่อไปนี้ด้วยนะครับ:\n"
            "\n"
            "• ชื่อ–นามสกุล\n"
            "• จำนวนผู้เดินทาง\n"
            "• เบอร์โทรศัพท์\n"
            "• อีเมลที่ติดต่อได้\n"
            "\n"
            "ทีมงานจะดำเนินการจองให้ทันทีครับ 💬\n"
            "**หากมีข้อสงสัยเพิ่มเติม เรายินดีตอบกลับให้ทันทีเลยครับ!**"
        )

        messages = TextSendMessage(text=response_content)
        line_bot_api.reply_message(event.reply_token, messages)
        LineMessage.objects.create(
            line_user=line_user,
            message_id=f"reply_postback_{trip_id}_{datetime.now().timestamp()}",
            message_type=LineMessage.MessageType.TEXT,
            direction=LineMessage.Direction.OUTGOING,
            content=response_content,
            timestamp=tz.now(),
            processed=True,
        )

    elif action == "confirm_booking":
        print("[DEBUG]: confirm_booking")

        metadata = line_user.user_metadata or {}
        trip_id   = metadata.get("trip_id")
        
        # Ensure count is int
        try:
            count = int(metadata.get("booking_person_count", 1))
            metadata["booking_person_count"] = count
        except:
            count = 1
            
        booking_equipment = metadata.get("booking_equipment") or []
        for eq in booking_equipment:
            try:
                eq["qty"] = int(eq.get("qty", 1))
            except:
                eq["qty"] = 1

        metadata["response_state"] = "PENDING_PAYMENT"
        line_user.user_status = "pending_payment"
        # Update normalized data back
        line_user.user_metadata = metadata
        line_user.save(update_fields=["user_metadata", "user_status"])

        payment_detail = _pending_payment_breakdown(line_user)
        response_parts = [
            "ขอบคุณครับ! ยืนยันการจองทริปเรียบร้อยแล้ว 🎉",
            "",
            f"🧭 รหัสทริป: {trip_id}",
            f"👥 จำนวนผู้เดินทาง: {count} คน",
            f"🎒 อุปกรณ์เพิ่มเติม: {len(booking_equipment)} รายการ",
        ]
        if payment_detail:
            response_parts.extend(
                ["", f"💰 ยอดที่ต้องชำระ: {int(payment_detail['grand_total']):,} บาท"]
            )
        response_parts.extend(["", *_promptpay_instruction_lines()])
        response_content = "\n".join(response_parts)

        qr_url = _promptpay_qr_url()
        messages = [
            TextSendMessage(text=response_content),
            ImageSendMessage(original_content_url=qr_url, preview_image_url=qr_url),
        ]

        line_bot_api.reply_message(event.reply_token, messages)

        # เก็บข้อความลงฐานข้อมูลแบบปกติ (ไม่มี META JSON)
        LineMessage.objects.create(
            line_user=line_user,
            message_id=f"reply_postback_{trip_id}_{datetime.now().timestamp()}",
            message_type=LineMessage.MessageType.TEXT,
            direction=LineMessage.Direction.OUTGOING,
            content=response_content,
            timestamp=tz.now(),
            processed=True,
        )

        logger.info(f"Booking metadata stored in LineUser.user_metadata for trip {trip_id}")

def get_or_create_line_user(user_id):
    """Get or create LINE user profile + link with internal User model"""
    try:
        line_user = LineUser.objects.get(line_user_id=user_id)
        return line_user

    except LineUser.DoesNotExist:
        try:
            # ดึงโปรไฟล์จาก LINE
            profile = line_bot_api.get_profile(user_id)
            display_name = profile.display_name or f"User_{user_id[:8]}"
            picture_url = profile.picture_url or ''
            status_message = profile.status_message or ''

        except LineBotApiError as e:
            logger.error(f"Error getting LINE profile: {str(e)}")
            display_name = f"User_{user_id[:8]}"
            picture_url = ''
            status_message = ''

        # ตรวจสอบว่า User ภายในระบบมีหรือยัง ถ้ายังให้สร้างใหม่
        user_obj, created = User.objects.get_or_create(
            name=display_name,
            defaults={
                "phone": "",
                "role": User.Role.CUSTOMER,
            },
        )

        # สร้าง LineUser พร้อมเชื่อมกับ User
        line_user = LineUser.objects.create(
            line_user_id=user_id,
            display_name=display_name,
            picture_url=picture_url,
            status_message=status_message,
            user=user_obj,  # 👈 ผูกไว้เลย
        )

        if created:
            logger.info(f"🧾 Created new User '{display_name}' and linked to LINE ID {user_id}")
        else:
            logger.info(f"🔗 Linked existing User '{display_name}' to LINE ID {user_id}")

        return line_user

        
def build_trip_carousel_flex(meta):
    trips = meta.get("trips", [])
    bubbles = []
    for meta in trips:
        trip_id = meta.get("trip_id") or ""
        trip_name = meta.get("trip_name") or "Trip_Name"
        trip_province = meta.get("trip_province") or "-"
        trip_date = meta.get("trip_date") or "-"
        trip_price_per_person = meta.get("trip_price_per_person") or "-"
        trip_image_url = meta.get("trip_image_url")
    

        bubble = {
            "type": "bubble",
            "hero": {
                "type": "image",
                "url": f"{trip_image_url}",
                "size": "full",
                "aspectRatio": "20:13",
                "aspectMode": "cover",
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": trip_name,
                        "weight": "bold",
                        "size": "lg",
                        "wrap": True
                    },
                    {
                        "type": "box",
                        "layout": "horizontal",
                        "contents": [
                            {
                                "type": "text",
                                "text": f"📍 {trip_province}",
                                "color": "#aaaaaa",
                                "size": "sm"
                            },
                            {
                                "type": "text",
                                "text": f"{trip_price_per_person} / ท่าน",
                                "size": "sm",
                                "color": "#aaaaaa",
                                "align": "end"
                            }
                        ],
                        "margin": "md"
                    },
                    {
                        "type": "separator",
                        "margin": "md"
                    },
                    {
                        "type": "box",
                        "layout": "horizontal",
                        "margin": "md",
                        "contents": [
                            {
                                "type": "box",
                                "layout": "vertical",
                                "contents": [
                                    {"type": "text", "text": "วันที่", "size": "sm", "color": "#aaaaaa"},
                                    {"type": "text", "text": trip_date, "size": "xxs"}
                                ]
                            }
                        ]
                    }
                ]
            },
            "footer": {
                "type": "box",
                "layout": "vertical",
                "spacing": "sm",
                "contents": [
                {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                    {
                        "type": "button",
                        "action": {
                            "type": "postback",
                            "label": "ดูรายละเอียดเพิ่มเติม",
                            "data": f"action=trip_detail&trip_id={trip_id}&trip_name={trip_name}"
                        },
                        "color": "#8A8AF8"
                    }
                    ],
                    "margin": "none",
                    "backgroundColor": "#EEF5F9",
                    "borderWidth": "none",
                    "cornerRadius": "md",
                    "paddingBottom": "none"
                },
                {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                    {
                        "type": "button",
                        "action": {
                            "type": "postback",
                            "label": "สนใจจองทริปนี้",
                            "data": f"action=trip_interest&trip_id={trip_id}&trip_name={trip_name}&trip_province={trip_province}&trip_date={trip_date}&trip_price_per_person={trip_price_per_person}"
                        },
                        "color": "#8A8AF8",
                        "style": "primary"
                    }

                    ],
                    "margin": "md",
                    "backgroundColor": "#8A8AF8",
                    "borderWidth": "none",
                    "cornerRadius": "md"
                }
                ],
                "flex": 0,
                "margin": "none"
            }
        }

        bubbles.append(bubble)

    # ---------- รวมทุก bubble เป็น carousel ----------
    flex_message = {
        "type": "carousel",
        "contents": bubbles
    }

    return flex_message

def build_booking_verify_flex(meta):
    trip_id                 = meta.get("trip_id") or "-"
    trip_name               = meta.get("trip_name") or "Trip_Name"
    trip_province           = meta.get("trip_province") or "-"
    trip_date               = meta.get("trip_date") or "-"
    trip_price_per_person   = meta.get("trip_price_per_person") or "0"
    trip_image_url          = meta.get("trip_image_url") or "-"
    customer_name           = meta.get("customer_name") or "-"
    customer_phone          = meta.get("customer_phone") or "-"
    customer_email          = meta.get("customer_email") or "-"
    booking_person_count    = meta.get("booking_person_count") or "1"
    booking_equipment       = meta.get("booking_equipment") or []
    
    # Calculate price automatically
    def parse_price(val):
        try: return float(str(val).replace(',', '').strip())
        except: return 0.0
        
    price_per = parse_price(trip_price_per_person)
    try: qty_person = int(booking_person_count)
    except: qty_person = 1
        
    total = price_per * qty_person
    for eq in booking_equipment:
        total += parse_price(eq.get("price")) * int(eq.get("qty") or 1)
        
    trip_total_price = f"{total:,.2f}"

    postback_data = "action=confirm_booking"
    
    print("\n[DEBUG]: booking_verify flex message data \n", postback_data , "\n")
    
    # Fix URL scheme
    valid_url = "https://via.placeholder.com/600x400"
    if str(trip_image_url).startswith("http://") or str(trip_image_url).startswith("https://"):
        valid_url = trip_image_url

    return {
        "type": "bubble",
        "hero": {
            "type": "image",
            "url": valid_url,
            "size": "full",
            "aspectRatio": "20:13",
            "aspectMode": "cover",
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
            {
                "type": "text",
                "text": trip_name,
                "weight": "bold",
                "size": "lg"
            },
            # {
            #     "type": "box",
            #     "layout": "vertical",
            #     "contents": [
            #     {
            #         "type": "text",
            #         "text": trip_description,
            #         "color": "#9c9c9c",
            #         "size": "xs"
            #     }
            #     ]
            # },
            {
                "type": "box",
                "layout": "vertical",
                "margin": "lg",
                "spacing": "sm",
                "contents": [
                {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                    {
                        "type": "text",
                        "text": f"📍 จังหวัด{trip_province}",
                        "color": "#aaaaaa",
                        "size": "sm"
                    }
                    ]
                },
                {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                        {
                            "type": "box",
                            "layout": "vertical",
                            "contents": [
                            {
                                "type": "text",
                                "text": "วันที่",
                                "size": "sm",
                                "color": "#aaaaaa"
                            },
                            {
                                "type": "text",
                                "text": trip_date,
                                "size": "xxs"
                            }
                            ]
                        }
                    ]
                },
                {
                    "type": "separator",
                    "margin": "lg"
                },
                {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                    {
                        "type": "text",
                        "text": "รายละเอียดค่าใช้จ่าย",
                        "size": "sm"
                    }
                    ],
                    "margin": "lg"
                },
                {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                        {
                            "type": "box",
                            "layout": "vertical",
                            "contents": [
                            {
                                "type": "text",
                                "text": "ชื่อ",
                                "size": "sm",
                                "color": "#aaaaaa"
                            },
                            {
                                "type": "text",
                                "text": f"คุณ {customer_name}",
                                "color": "#aaaaaa",
                                "size": "xxs"
                            }
                            ]
                        }
                    ]
                },
                {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                        {
                            "type": "box",
                            "layout": "vertical",
                            "contents": [
                            {
                                "type": "text",
                                "text": "เบอร์โทรศัพท์",
                                "size": "sm",
                                "color": "#aaaaaa"
                            },
                            {
                                "type": "text",
                                "text": f"{customer_phone}",
                                "color": "#aaaaaa",
                                "size": "xxs"
                            }
                            ]
                        }
                    ]
                },
                {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                        {
                            "type": "box",
                            "layout": "vertical",
                            "contents": [
                            {
                                "type": "text",
                                "text": "email",
                                "size": "sm",
                                "color": "#aaaaaa"
                            },
                            {
                                "type": "text",
                                "text": f"{customer_email}",
                                "color": "#aaaaaa",
                                "size": "xxs"
                            }
                            ]
                        }
                    ]
                },
                {
                    "type": "separator",
                    "margin": "lg"
                },
                {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                    {
                        "type": "text",
                        "text": "รายละเอียดค่าใช้จ่าย",
                        "color": "#aaaaaa",
                        "size": "sm"
                    }
                    ],
                    "margin": "lg"
                },
                {
                    "type": "box",
                    "layout": "horizontal",
                    "spacing": "sm",
                    "contents": [
                    {
                        "type": "text",
                        "text": "ท่านละ",
                        "color": "#aaaaaa",
                        "size": "sm",
                        "align": "start",
                        "flex": 5
                    },
                    {
                        "type": "text",
                        "text": f"x{booking_person_count}",
                        "color": "#666666",
                        "size": "xs",
                        "align": "center"
                    },
                    {
                        "type": "text",
                        "text": trip_price_per_person,
                        "wrap": True,
                        "color": "#666666",
                        "size": "sm",
                        "flex": 2,
                        "align": "end"
                    }
                    ],
                    "margin": "none",
                    "flex": 3,
                    "alignItems": "center"
                },
                *[
                    {
                        "type": "box",
                        "layout": "horizontal",
                        "spacing": "sm",
                        "contents": [
                            {
                                "type": "text",
                                "text": eq.get("name", ""),
                                "color": "#aaaaaa",
                                "size": "sm",
                                "align": "start",
                                "flex": 5
                            },
                            {
                                "type": "text",
                                "color": "#666666",
                                "size": "xs",
                                "align": "center",
                                "text": f"x{eq['qty']}" if eq.get("qty") else " "
                            },
                            {
                                "type": "text",
                                "text": eq.get("price", ""),
                                "wrap": True,
                                "color": "#666666",
                                "size": "sm",
                                "flex": 2,
                                "align": "end"
                            }
                        ],
                        "margin": "none",
                        "flex": 3,
                        "alignItems": "center"
                    }
                    for eq in booking_equipment or []
                ],
                {
                    "type": "box",
                    "layout": "horizontal",
                    "spacing": "sm",
                    "contents": [
                    {
                        "type": "text",
                        "text": "ราคารวม",
                        "color": "#666666",
                        "size": "lg",
                        "align": "start",
                        "flex": 5,
                        "weight": "bold"
                    },
                    {
                        "type": "text",
                        "text": trip_total_price,
                        "wrap": True,
                        "color": "#666666",
                        "size": "sm",
                        "flex": 5,
                        "align": "end",
                        "weight": "bold"
                    }
                    ],
                    "margin": "none",
                    "flex": 3,
                    "alignItems": "center"
                }
                ]
            }
            ]
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
            {
                "type": "box",
                "layout": "vertical",
                "contents": [
                {
                    "type": "button",
                    "action": {
                    "type": "uri",
                    "label": "แก้ไข",
                    "uri": "http://linecorp.com/"
                    },
                    "color": "#8A8AF8"
                }
                ],
                "margin": "none",
                "backgroundColor": "#EEF5F9",
                "borderWidth": "none",
                "cornerRadius": "md",
                "paddingBottom": "none"
            },
            {
                "type": "box",
                "layout": "vertical",
                "contents": [
                {
                    "type": "button",
                    "action": {
                        "type": "postback",
                        "label": "ยืนยันการจอง",
                        "data": postback_data
                    },
                    "color": "#8A8AF8",
                    "style": "primary"
                }

                ],
                "margin": "md",
                "backgroundColor": "#8A8AF8",
                "borderWidth": "none",
                "cornerRadius": "md"
            }
            ],
            "flex": 0,
            "margin": "none"
        }
    }




def booking_confirm_flex(meta):
    trip_name = meta.get("trip_name", "ไม่ระบุชื่อทริป")
    trip_province = meta.get("trip_province", "-")
    trip_date = meta.get("trip_date", "-")
    trip_duration = meta.get("trip_duration", "ไม่ระบุระยะเวลา")
    booking_person_count = meta.get("booking_person_count", "1")
    trip_total_price = meta.get("trip_total_price", "0")
    booking_equipment = meta.get("booking_equipment", [])
    print(meta)


    customer_name           = meta.get("customer_name") or "-"
    customer_phone          = meta.get("customer_phone") or "-"
    customer_email          = meta.get("customer_email") or "-"


    equipment_contents = []
    if booking_equipment:
        for eq in booking_equipment:
            name = eq.get("name", "-")
            qty = eq.get("qty", 1)
            equipment_contents.append({
                "type": "box",
                "layout": "horizontal",
                "contents": [
                    {"type": "text", "text": f"{name} ×{qty}", "size": "md", "flex": 5, "weight": "bold"}
                ],
                "margin": "sm"
            })
    else:
        equipment_contents.append({
            "type": "text",
            "text": "ไม่มีอุปกรณ์เสริม",
            "size": "md",
            "color": "#777777",
            "margin": "sm"
        })

    return {
        "type": "bubble",
        "header": {
            "type": "box",
            "layout": "baseline",
            "contents": [
                {
                    "type": "icon",
                    "url": "https://cdn-icons-png.flaticon.com/512/845/845646.png",
                    "size": "xxl",
                    "scaling": True,
                    "margin": "xs",
                    "offsetTop": "sm"
                },
                {
                    "type": "text",
                    "text": "Booking Confirmed!",
                    "weight": "bold",
                    "size": "xl",
                    "color": "#FFFFFF",
                    "align": "center",
                    "margin": "md"
                }
            ],
            "backgroundColor": "#0A7AFF",
            "paddingAll": "24px",
            "cornerRadius": "none"
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "paddingAll": "20px",
            "contents": [
                {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": trip_name,
                            "weight": "bold",
                            "size": "xl",
                            "color": "#000000",
                            "wrap": True
                        },
                        {
                            "type": "text",
                            "text": f"📍 {trip_province}",
                            "size": "sm",
                            "color": "#777777",
                            "margin": "sm",
                            "wrap": True
                        }
                    ]
                },
                {"type": "separator", "margin": "xl"},
                {
                    "type": "box",
                    "layout": "vertical",
                    "margin": "lg",
                    "contents": [
                        {"type": "text", "text": "📅 วันที่", "size": "xs", "color": "#999999"},
                        {"type": "text", "text": f"{trip_date}", "size": "md", "weight": "bold", "margin": "xs"},
                        {"type": "text", "text": "🕓 ระยะเวลา", "size": "xs", "color": "#999999"},
                        {"type": "text", "text": f"{trip_duration}", "size": "md", "weight": "bold", "margin": "xs"},
                    ]
                },
                {
                    "type": "box",
                    "layout": "vertical",
                    "margin": "lg",
                    "contents": [
                        {"type": "text", "text": "👤 จองโดย", "size": "xs", "color": "#999999"},
                        {"type": "text", "text": customer_name, "size": "md", "weight": "bold", "margin": "xs"}
                    ]
                },
                {
                    "type": "box",
                    "layout": "vertical",
                    "margin": "lg",
                    "contents": [
                        {"type": "text", "text": "👥 จำนวนผู้เดินทาง", "size": "xs", "color": "#999999"},
                        {"type": "text", "text": f"{booking_person_count} ท่าน", "size": "md", "weight": "bold", "margin": "xs"}
                    ]
                },
                {
                    "type": "box",
                    "layout": "vertical",
                    "margin": "lg",
                    "contents": [{"type": "text", "text": "🎒 อุปกรณ์เสริม", "size": "xs", "color": "#999999"}] + equipment_contents
                },
                {
                    "type": "box",
                    "layout": "vertical",
                    "margin": "lg",
                    "contents": [
                        {"type": "text", "text": "💳 ราคารวมทั้งหมด", "size": "xs", "color": "#999999"},
                        {"type": "text", "text": f"฿{int(float(trip_total_price)):,}", "size": "xl", "weight": "bold", "margin": "xs", "color": "#0A7AFF"}
                    ]
                }
            ]
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "backgroundColor": "#F5F5F5",
            "paddingAll": "15px",
            "contents": [
            {
                "type": "text",
                "text": "Thank you for your booking with GoGo Trip!",
                "size": "xs",
                "color": "#999999",
                "align": "center"
            }
            ]
        }
    }



def imageBase64(event):
    try:
        message_content = line_bot_api.get_message_content(event.message.id)
        image_bytes = b"".join(chunk for chunk in message_content.iter_content())
        base64_str = base64.b64encode(image_bytes).decode("utf-8")
        return base64_str
    except LineBotApiError as e:
        print("❌ Error get image:", e)
        return None



def get_meta(content: str):
    """ดึง JSON meta ล่าสุดจากข้อความที่มี TAG [__META_JSON__]"""
    pattern = r"\[__META_JSON__\](.*?)\[__META_JSON__\]"
    matches = re.findall(pattern, content)
    if matches:
        return json.loads(matches[-1])
    return None


def _promptpay_qr_url() -> str:
    u = getattr(settings, "PROMPTPAY_QR_IMAGE_URL", None)
    if u and str(u).strip():
        return str(u).strip()
    return (
        "https://fcnuamycwiqdgcrwlcba.supabase.co/storage/v1/object/public/"
        "app-object-storage/payment/promptpay.png"
    )


def _promptpay_transfer_lines() -> list[str]:
    """รายละเอียด PromptPay สำหรับข้อความลูกค้า (อิงค่าใน settings / .env)"""
    bank = (getattr(settings, "SLIPOK_BANK_NAME_TH", None) or "").strip()
    pp = (getattr(settings, "SLIPOK_PROMPTPAY_NUMBER", None) or "").strip()
    owner = (getattr(settings, "SLIPOK_BANK_ACCOUNT_OWNER", None) or "").strip()
    lines: list[str] = [
        "📲 ชำระเงินผ่าน PromptPay",
        "",
    ]
    if bank:
        lines.append(f"🏦 ธนาคาร: {bank}")
    if owner:
        lines.append(f"👤 ชื่อบัญชี / ผู้รับเงิน: {owner}")
    if pp:
        lines.append(f"📱 PromptPay (เบอร์โทร): {pp}")
    if not (bank or owner or pp):
        lines.append("ดูเลข PromptPay ได้จาก QR ในภาพที่ทีมส่งให้ครับ")
    lines.extend(
        [
            "",
            "สแกน QR ในภาพถัดไป หรือโอนผ่านเลข PromptPay ด้านบนให้ตรงยอดที่แจ้ง",
            "เมื่อโอนแล้ว ส่งสลิปเป็นรูปภาพกลับมาที่แชทนี้เพื่อยืนยันได้เลยครับ 🙏",
        ]
    )
    return lines


def _promptpay_instruction_lines() -> list[str]:
    """รวมเส้นคั่น + รายละเอียด PromptPay (หลังสรุปยอดจอง)"""
    return ["──────────────", *_promptpay_transfer_lines()]


def _pending_payment_breakdown(line_user) -> dict | None:
    """ข้อมูลยอดและทริปจาก user_metadata ระหว่างรอชำระเงิน — ใช้ทั้งข้อความแจ้งยอดและ SlipOK"""
    meta = line_user.user_metadata or {}
    trip_id = meta.get("trip_id")
    if not trip_id:
        return None
    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        return None

    person_count = int(meta.get("booking_person_count") or 1)
    base = Decimal(str(trip.price_per_person))
    trip_subtotal = base * person_count

    equip_lines: list[str] = []
    equip_total = Decimal("0")
    for eq in meta.get("booking_equipment") or []:
        qty = int(eq.get("qty") or 0)
        if qty <= 0:
            continue
        eid = eq.get("equipment_id")
        if not eid:
            continue
        try:
            equipment = Equipment.objects.get(id=eid)
        except Equipment.DoesNotExist:
            logger.warning("Pending payment detail: equipment id=%s missing", eid)
            continue
        line_total = equipment.price * qty
        equip_total += line_total
        equip_lines.append(f"  • {equipment.name} × {qty} = {int(line_total):,} บาท")

    grand_total = trip_subtotal + equip_total

    start, end = trip.start_date, trip.end_date
    if start.month == end.month and start.year == end.year:
        trip_date = f"{start.day} - {end.day} {formats.date_format(end, 'F Y', use_l10n=True)}"
    else:
        trip_date = (
            f"{formats.date_format(start, 'j F Y', use_l10n=True)} - "
            f"{formats.date_format(end, 'j F Y', use_l10n=True)}"
        )

    return {
        "trip": trip,
        "meta": meta,
        "person_count": person_count,
        "base": base,
        "trip_subtotal": trip_subtotal,
        "equip_lines": equip_lines,
        "equip_total": equip_total,
        "grand_total": grand_total,
        "trip_date": trip_date,
        "cust_name": meta.get("customer_name") or "-",
        "cust_phone": meta.get("customer_phone") or "-",
        "cust_email": meta.get("customer_email") or "-",
    }


def build_pending_payment_detail_text(line_user) -> str:
    """
    สรุปยอดและรายละเอียดการจองจาก user_metadata ขณะรอชำระเงิน
    (ให้ลูกค้าพิมพ์ "ชำระเงิน" เพื่อดูซ้ำได้)
    """
    meta = line_user.user_metadata or {}
    if not meta.get("trip_id"):
        return (
            "ยังไม่พบข้อมูลการจองค้างชำระในระบบครับ\n"
            "หากชำระไปแล้วหรือมีข้อสงสัย รบกวนติดต่อทีมงานครับ 🙏"
        )
    breakdown = _pending_payment_breakdown(line_user)
    if breakdown is None:
        return "ไม่พบข้อมูลทริปครับ กรุณาติดต่อทีมงานครับ"

    trip = breakdown["trip"]
    person_count = breakdown["person_count"]
    base = breakdown["base"]
    trip_subtotal = breakdown["trip_subtotal"]
    equip_lines = breakdown["equip_lines"]
    equip_total = breakdown["equip_total"]
    grand_total = breakdown["grand_total"]
    trip_date = breakdown["trip_date"]
    cust_name = breakdown["cust_name"]
    cust_phone = breakdown["cust_phone"]
    cust_email = breakdown["cust_email"]

    lines: list[str] = [
        "💰 รายละเอียดการชำระเงิน (คำสั่งจองของคุณ)",
        "",
        f"📌 ทริป: {trip.name}",
        f"📍 จังหวัด: {trip.province}",
        f"📅 วันเดินทาง: {trip_date}",
        f"👥 จำนวนผู้เดินทาง: {person_count} คน",
        f"💵 ราคาทริปต่อคน: {int(base):,} บาท",
        f"➡️ ค่าทริปรวม: {int(trip_subtotal):,} บาท",
    ]
    if equip_lines:
        lines.append("🎒 อุปกรณ์เสริม:")
        lines.extend(equip_lines)
        lines.append(f"➡️ รวมอุปกรณ์: {int(equip_total):,} บาท")
    lines.extend(
        [
            "──────────────",
            f"✅ ยอดที่ต้องชำระทั้งหมด: {int(grand_total):,} บาท",
            "",
            "👤 ผู้จอง:",
            f"  • ชื่อ: {cust_name}",
            f"  • โทร: {cust_phone}",
            f"  • อีเมล: {cust_email}",
            "",
            "──────────────",
        ]
    )
    lines.extend(_promptpay_transfer_lines())
    return "\n".join(lines)


def _merge_nested_slip_receiver_sender(d: dict) -> dict:
    """รวมข้อมูล receiver/sender แบบซ้อน (SlipOK เก่า) เข้า key แบน receiver_account / sender_account ฯลฯ"""
    out = dict(d)
    recv = d.get("receiver") if isinstance(d.get("receiver"), dict) else {}
    recv_acct = recv.get("account") if isinstance(recv.get("account"), dict) else {}
    send = d.get("sender") if isinstance(d.get("sender"), dict) else {}
    send_acct = send.get("account") if isinstance(send.get("account"), dict) else {}
    if recv.get("displayName") and not out.get("receiver_displayName"):
        out["receiver_displayName"] = recv.get("displayName")
    if recv_acct.get("value") and not out.get("receiver_account"):
        out["receiver_account"] = recv_acct.get("value")
    if send.get("displayName") and not out.get("sender_displayName"):
        out["sender_displayName"] = send.get("displayName")
    if send_acct.get("value") and not out.get("sender_account"):
        out["sender_account"] = send_acct.get("value")
    if d.get("message") is not None and out.get("slip_message") is None:
        out["slip_message"] = d.get("message")
    return out


def _extract_slip_transaction_dict(slip_payload: dict | None) -> dict:
    """
    ดึง dict รายการโอนจาก response SlipOK รองรับหลายรูปแบบ:
    - แบบแบน: transRef, amount, receiver_displayName, sender_account, ... (ระดับเดียวกับ data)
    - แบบห่อ: { success, data: { data: { transRef, ... } } } หรือ { data: { transRef, ... } }
    - แบบเก่า: data.receiver / data.sender แบบซ้อน account
    """
    if not slip_payload or not isinstance(slip_payload, dict):
        return {}

    # 1) แบบแบน — โดยตรง (หรือผลที่แยกจาก data แล้ว)
    if slip_payload.get("transRef") and "data" not in slip_payload:
        return slip_payload

    d = slip_payload.get("data")
    if not isinstance(d, dict):
        return {}

    # 2) ซ้อนอีกชั้น data.data (บางรุ่น API)
    inner = d.get("data")
    if isinstance(inner, dict) and inner.get("transRef"):
        return _merge_nested_slip_receiver_sender(inner)

    # 3) แบบแบนอยู่ใต้ data (อาจมี receiver/sender ซ้อนอยู่ด้วย)
    if d.get("transRef"):
        return _merge_nested_slip_receiver_sender(d)

    # 4) แบบเก่า: receiver / sender เป็น object
    recv = d.get("receiver") if isinstance(d.get("receiver"), dict) else {}
    recv_acct = recv.get("account") if isinstance(recv.get("account"), dict) else {}
    send = d.get("sender") if isinstance(d.get("sender"), dict) else {}
    send_acct = send.get("account") if isinstance(send.get("account"), dict) else {}
    detail = {
        "transRef": d.get("transRef"),
        "amount": d.get("amount"),
        "paidLocalAmount": d.get("paidLocalAmount"),
        "transDate": d.get("transDate"),
        "transTime": d.get("transTime"),
        "receivingBank": d.get("receivingBank"),
        "sendingBank": d.get("sendingBank"),
        "receiver_displayName": recv.get("displayName"),
        "receiver_account": recv_acct.get("value"),
        "sender_displayName": send.get("displayName"),
        "sender_account": send_acct.get("value"),
        "language": d.get("language"),
        "slip_message": d.get("message"),
    }
    return {k: v for k, v in detail.items() if v is not None or k in ("transRef", "amount", "receiver_account", "sender_account")}


def _slip_payload_payment_fields(slip_payload: dict | None) -> dict:
    """ดึงฟิลด์สำหรับ Payment จาก body SlipOK (transRef, บัญชีผู้รับ/ผู้โอน, ฯลฯ)"""
    tx = _extract_slip_transaction_dict(slip_payload)
    if not tx:
        return {}

    recv_raw = str(tx.get("receiver_account") or "").strip()
    send_raw = str(tx.get("sender_account") or "").strip()
    bank_account = recv_raw or send_raw or ""

    trans_ref = str(tx.get("transRef") or "")[:100]
    detail = {
        "transRef": tx.get("transRef"),
        "amount": tx.get("amount"),
        "paidLocalAmount": tx.get("paidLocalAmount"),
        "transDate": tx.get("transDate"),
        "transTime": tx.get("transTime"),
        "receivingBank": tx.get("receivingBank"),
        "sendingBank": tx.get("sendingBank"),
        "receiver_displayName": tx.get("receiver_displayName"),
        "receiver_account": tx.get("receiver_account"),
        "sender_displayName": tx.get("sender_displayName"),
        "sender_account": tx.get("sender_account"),
        "language": tx.get("language"),
        "slip_message": tx.get("slip_message") if tx.get("slip_message") is not None else tx.get("message"),
    }
    detail = {k: v for k, v in detail.items() if v is not None}
    if detail:
        logger.info(
            "SlipOK parsed detail: %s",
            json.dumps(detail, ensure_ascii=False)[:2000],
        )

    return {
        "transaction_id": trans_ref,
        "bank_account": str(bank_account)[:255],
    }


def create_booking_and_payment(
    line_user,
    meta,
    *,
    slip_ok_payload: dict | None = None,
    slip_image_bytes: bytes | None = None,
):
    """สร้าง Booking + Payment จากข้อมูล meta และแนบข้อมูลทริปกลับ
    slip_ok_payload / slip_image_bytes — จาก SlipOK เมื่อยืนยันสลิปแล้ว (อัปโหลดสลิปไป Supabase)
    """

    print(f"[DEBUG] Booking&Payment: {meta}")
    trip = Trip.objects.get(id=meta["trip_id"])

    # ถ้า line_user ไม่มี user ผูกไว้ → สร้าง user ใหม่อัตโนมัติ
    customer = getattr(line_user, "user", None)
    if not customer:
        customer, _ = User.objects.get_or_create(
            name=line_user.display_name or f"LINE_{line_user.line_user_id[:6]}",
            defaults={
                "phone": "",
                "role": User.Role.CUSTOMER,
            },
        )
        line_user.user = customer
        line_user.save(update_fields=["user"])
        logger.info(f"👤 Created new user for LINE user {line_user.display_name} ({line_user.line_user_id})")

    # ราคาทริปหลัก
    base_price = Decimal(meta.get("trip_price_per_person") or trip.price_per_person)
    person_count = int(meta.get("booking_person_count", 1))
    trip_total_price = base_price * person_count

    # สร้าง Booking
    booking = Booking.objects.create(
        trip=trip,
        customer=customer,
        group_size=person_count,
        total_price=trip_total_price,
        status=Booking.Status.CONFIRMED,
    )

    # รวมอุปกรณ์เสริม (ถ้ามี)
    total_equipment_price = Decimal("0")
    for eq in meta.get("booking_equipment", []):
        equipment_id = eq.get("equipment_id")
        qty = int(eq.get("qty") or 0)
        if qty <= 0:
            continue

        try:
            equipment = Equipment.objects.get(id=equipment_id)
        except Equipment.DoesNotExist:
            logger.warning(f"⚠️ Equipment id={equipment_id} not found, skip.")
            continue

        equipment_total = equipment.price * qty
        total_equipment_price += equipment_total

        BookingEquipment.objects.create(
            booking=booking,
            equipment=equipment,
            quantity=qty,
            total_price=equipment_total,
        )

    # อัปเดตราคารวม (ทริป + อุปกรณ์)
    booking.total_price = trip_total_price + total_equipment_price
    booking.save(update_fields=["total_price"])

    # สร้าง Payment record (+ รายละเอียดจากสลิป SlipOK ถ้ามี)
    slip_extra: dict = {}
    if slip_ok_payload:
        slip_extra = _slip_payload_payment_fields(slip_ok_payload)

    payment = Payment.objects.create(
        booking=booking,
        amount=booking.total_price,
        payment_method=Payment.Method.BANK_TRANSFER,
        payment_status=Payment.Status.PAID,
        paid_at=tz.now(),
        transaction_id=slip_extra.get("transaction_id", ""),
        bank_account=slip_extra.get("bank_account", ""),
    )

    if slip_image_bytes:
        from .supabase_storage import upload_payment_slip

        pub, _path = upload_payment_slip(slip_image_bytes, payment.id)
        if pub:
            payment.payment_url = pub
            payment.save(update_fields=["payment_url"])
            logger.info("Payment slip stored | payment=%s url=%s", payment.id, (pub or "")[:160])
        else:
            logger.warning(
                "Payment slip bytes present but payment_url not set | payment=%s — "
                "configure SUPABASE_URL+SUPABASE_SERVICE_ROLE_KEY or PUBLIC_BACKEND_URL / LINE_CHANNEL_NGROK_BASE",
                payment.id,
            )

    # คำนวณวัน เวลา และระยะเวลา (เวอร์ชันไทย)
    start = trip.start_date
    end = trip.end_date

    # ถ้าเดือนเดียวกันและปีเดียวกัน
    if start.month == end.month and start.year == end.year:
        # แสดงแบบ 14 - 15 ธันวาคม 2025
        trip_date = f"{start.day} - {end.day} {formats.date_format(end, 'F Y', use_l10n=True)}"
    else:
        # แสดงเต็ม ถ้าข้ามเดือนหรือปี
        trip_date = f"{formats.date_format(start, 'j F Y', use_l10n=True)} - {formats.date_format(end, 'j F Y', use_l10n=True)}"

    trip_time = f"{trip.start_date.strftime('%H:%M')} - {trip.end_date.strftime('%H:%M')}"

    duration_days = (trip.end_date.date() - trip.start_date.date()).days + 1
    trip_duration = f"{duration_days} วัน {duration_days - 1} คืน" if duration_days > 1 else "1 วัน"

    # ✅ Meta สำหรับ Flex Confirm
    confirm_meta = {
        "trip_id": str(trip.id),
        "trip_name": trip.name,
        "trip_province": trip.province,
        "trip_date": trip_date,
        "trip_time": trip_time,
        "trip_duration": trip_duration,
        "trip_price_per_person": f"{int(trip.price_per_person):,}",
        "trip_total_price": str(booking.total_price),
        "booking_person_count": str(person_count),
        "booking_equipment": meta.get("booking_equipment", []),
        "customer_name": meta.get("customer_name", "-")
    }

    # Log สรุป
    print(
        f"✅ Booking+Payment created | LINE user: {line_user.display_name or line_user.line_user_id} | "
        f"Trip: {trip.name} | People: {person_count} | Total: {booking.total_price} | Duration: {trip_duration}"
    )

    try:
        from .booking_notifications import notify_booking_created

        notify_booking_created(booking)
    except Exception as e:
        logger.exception("notify_booking_created failed: %s", e)

    return booking, payment, confirm_meta



def _strip_outbound_meta_json(content: str) -> str:
    """เลื่อนเฉพาะข้อความที่ผู้ใช้อ่าน — ตัดบล็อก [__META_JSON__] ที่แนบตอนบันทึก trip_list / booking meta"""
    if not content or "[__META_JSON__]" not in content:
        return (content or "").strip()
    return content.split("[__META_JSON__]", 1)[0].strip()


def get_chat_history(line_user, limit=24) -> list[BaseMessage]:
    """ดึงประวัติการสนทนาล่าสุดของ user ในรูปแบบ list[BaseMessage] (ล่าสุด = ท้ายรายการ)"""
    messages = (
        LineMessage.objects.filter(line_user=line_user)
        .order_by("-timestamp")[:limit]
    )
    messages = list(messages)[::-1]

    history_messages: list[BaseMessage] = []
    for m in messages:
        if m.direction == LineMessage.Direction.INCOMING:
            history_messages.append(HumanMessage(content=(m.content or "").strip()))
        else:
            history_messages.append(AIMessage(content=_strip_outbound_meta_json(m.content or "")))

    return history_messages


def send_post_trip_feedback(line_user_id: str, trip_id: str, trip_name: str, booking_id: str = None):
    """
    Send Quick Reply asking for feedback after the trip ends.
    booking_id is included in the payload so it can be saved with the Rating.
    """
    text_content = (
        f"🌟 ทริป '{trip_name}' ของคุณจบลงแล้ว\n"
        f"ขอบคุณที่เดินทางกับ GoGoTrip ครับ\n\n"
        f"โดยรวมแล้วคุณรู้สึกอย่างไรกับทริปนี้?"
    )
    
    like_payload = f"feedback:like:{trip_id}"
    dislike_payload = f"feedback:dislike:{trip_id}"
    if booking_id:
        like_payload += f":{booking_id}"
        dislike_payload += f":{booking_id}"
    
    quick_reply = QuickReply(
        items=[
            QuickReplyButton(
                action=PostbackAction(
                    label="👍 ประทับใจ",
                    data=like_payload,
                    display_text="👍 ประทับใจ",
                )
            ),
            QuickReplyButton(
                action=PostbackAction(
                    label="👎 ไม่ประทับใจ",
                    data=dislike_payload,
                    display_text="👎 ไม่ประทับใจ",
                )
            ),
        ]
    )
    
    message = TextSendMessage(text=text_content, quick_reply=quick_reply)
    
    try:
        line_bot_api.push_message(line_user_id, message)
        logger.info(f"Feedback sent to {line_user_id} for trip {trip_id} booking {booking_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to send feedback to {line_user_id}: {e}")
        return False
