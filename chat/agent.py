from __future__ import annotations

import os
import httpx
import json
import logging
from typing import Any, Dict, Literal


from pydantic import BaseModel, Field

from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, ToolMessage

from langchain.agents import create_agent

import requests
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage

from .models import *
from .prompts import (
    CLASSIFY_SYSTEMPROMPT,
    build_trip_system_prompt,
    build_friendly_system_prompt,
    PAYMENT_VERIFY_SYSTEMPROMPT,
)

from .tools import get_trips, get_date, get_equipments, get_my_trips


logger = logging.getLogger(__name__)


def _extract_last_ai_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict) and part.get("type") == "text":
                parts.append(part.get("text") or "")
        return "".join(parts)
    return str(content)


def _strip_line_meta_json_suffix(content: str) -> str:
    """Strip Flex/trip_list metadata blob stored on outbound LineMessage (not needed in LLM context)."""
    if not content or "[__META_JSON__]" not in content:
        return (content or "").strip()
    return content.split("[__META_JSON__]", 1)[0].strip()


def _format_stored_history_for_prompt(history: list | None) -> str:
    """Readable transcript for classify / friendly (oldest → newest)."""
    if not history:
        return "(ไม่มีข้อความก่อนหน้า)"
    lines: list[str] = []
    for msg in history:
        if isinstance(msg, HumanMessage):
            role = "User"
        elif isinstance(msg, AIMessage):
            role = "Assistant"
        else:
            role = type(msg).__name__
        text = _extract_last_ai_text(getattr(msg, "content", ""))
        if isinstance(text, str):
            text = _strip_line_meta_json_suffix(text)
        lines.append(f"{role}: {text}")
    return "\n".join(lines)


def _prior_turns_for_classifier(history: list | None) -> list:
    """DB history ends with the current user message; classifier prompt keeps it only in Latest user message."""
    if not history:
        return []
    if isinstance(history[-1], HumanMessage):
        return list(history[:-1])
    return list(history)


def _messages_for_admin_agent(user_text: str, history: list | None) -> list:
    """
    Admin agent must receive the full thread: prior Human/AI turns plus the current user message.
    get_chat_history() already ends with the latest HumanMessage (saved before the agent runs).
    """
    if history:
        return list(history)
    return [HumanMessage(content=user_text)]


def _strip_json_code_fence(s: str) -> str:
    s = s.strip()
    if not s.startswith("```"):
        return s
    lines = s.split("\n")
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    return "\n".join(lines).strip()


def _coerce_llm_response_envelope(raw: str) -> Dict[str, Any]:
    """Turn the admin model's last message into a flat tripbot response dict."""
    text = _strip_json_code_fence(raw)
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return {"response_type": "text", "response_content": raw.strip(), "response_meta": {}}

    if not isinstance(data, dict):
        return {"response_type": "text", "response_content": raw.strip(), "response_meta": {}}

    if "response_type" in data and "response_content" in data:
        meta = data.get("response_meta") if isinstance(data.get("response_meta"), dict) else {}
        rc = data["response_content"]
        if isinstance(rc, (dict, list)):
            rc = json.dumps(rc, ensure_ascii=False)
        return {
            "response_type": str(data["response_type"]),
            "response_content": str(rc) if rc is not None else "",
            "response_meta": meta,
        }

    return {"response_type": "text", "response_content": raw.strip(), "response_meta": {}}


def _unwrap_accidental_json_in_response_content(resp: Dict[str, Any]) -> Dict[str, Any]:
    """If response_content holds a full JSON envelope string, promote fields to top level."""
    out = dict(resp)
    rc = out.get("response_content")
    if not isinstance(rc, str):
        return out
    t = rc.strip()
    if not t.startswith("{"):
        return out
    try:
        inner = json.loads(t)
    except json.JSONDecodeError:
        return out
    if not isinstance(inner, dict) or "response_content" not in inner:
        return out
    if "response_type" not in inner:
        return out
    out["response_type"] = inner.get("response_type", out.get("response_type"))
    out["response_content"] = inner.get("response_content", "")
    im = inner.get("response_meta") if isinstance(inner.get("response_meta"), dict) else {}
    base = out.get("response_meta") if isinstance(out.get("response_meta"), dict) else {}
    out["response_meta"] = {**base, **im}
    return out


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
THAI_LLM_API_KEY = os.getenv("THAI_LLM_API_KEY")


# ---------------- LLMs ----------------

# llm_fast = ChatGoogleGenerativeAI(
#     model="gemini-2.5-flash-lite",
#     google_api_key=GOOGLE_API_KEY,
#     temperature=0.7,
# )

# llm_answer = ChatGoogleGenerativeAI(
#     model="gemini-2.5-flash-lite",
#     google_api_key=GOOGLE_API_KEY,
#     temperature=0.7,
# )

llm_fast = ChatOpenAI(
    model="gpt-4.1-mini",
    openai_api_key=OPENAI_API_KEY,
    temperature=0.7,
)

llm_answer = ChatOpenAI(
    model="gpt-4.1-mini",
    openai_api_key=OPENAI_API_KEY,
    temperature=0.7,
)

# ---------------- Response Schema ----------------

class LLM_Response(BaseModel):
    response_type: str = Field(description="text, trip_list, booking_verify, error")
    response_content: str = Field(description="Main message")
    response_meta: Dict[str, Any] = Field(default_factory=dict)


class ClassifyRoute(BaseModel):
    intent: Literal["admin_chat", "friendly_chat", "cancel_chat"] = Field(
        description="admin_chat = trips/bookings/tools; friendly_chat = chit-chat; cancel_chat = cancel/refund trip"
    )
    reply_language: Literal["th", "en"] = Field(
        description="th for Thai-heavy messages, en for English-heavy"
    )


# ---------------- Classify Agent ----------------

_DEFAULT_ROUTE = ClassifyRoute(intent="friendly_chat", reply_language="th")

llm_classify_router = llm_fast.with_structured_output(ClassifyRoute)


def classify_agent(user_text, history=None):
    prior = _prior_turns_for_classifier(history)
    hist_block = _format_stored_history_for_prompt(prior)
    message = f"Latest user message:\n{user_text}\n\nPrior conversation (oldest first):\n{hist_block}"
    try:
        out = llm_classify_router.invoke(
            [
                {"role": "system", "content": CLASSIFY_SYSTEMPROMPT},
                {"role": "user", "content": message},
            ]
        )
        return out.intent, out.reply_language
    except Exception:
        logger.exception("classify_agent structured output failed; using default route")
        return _DEFAULT_ROUTE.intent, _DEFAULT_ROUTE.reply_language


def _cancel_chat_response(line_user, reply_language: str | None) -> Dict[str, Any]:
    """
    Auto reply for trip cancellation with staff contact information (TH/EN).
    """
    lang = (reply_language or "th").strip().lower()
    if lang not in ("th", "en"):
        lang = "th"

    meta: Dict[str, Any] = {"intent": "cancel_chat", "reply_language": lang}

    if lang == "en":
        content = (
            "TRIP CANCELLATION\n"
            "We've received your request to cancel. Currently, our AI can't process cancellations directly for security reasons.\n\n"
            "Please contact our support team to proceed with your request:\n\n"
            "📞 Phone: 099-123-4567\n"
            "✉️ Email: support@gogotrip.co.th\n"
            "⏰ Hours: 09:00 - 18:00 (Daily)\n\n"
            "Our staff will take care of you immediately. Hope to see you on another trip! 🌿"
        )
    else:
        content = (
            "แจ้งยกเลิกการจอง\n"
            "ได้รับแจ้งความประสงค์แล้วครับ เพื่อความปลอดภัยของข้อมูลการจอง ระบบอัตโนมัติจะไม่สามารถยกเลิกได้โดยตรงครับ\n\n"
            "รบกวนคุณลูกค้าติดต่อเจ้าหน้าที่เพื่อดำเนินการยกเลิก/คืนเงิน ได้ที่:\n\n"
            "📞 โทร: 099-123-4567\n"
            "✉️ อีเมล: support@gogotrip.co.th\n"
            "⏰ เวลาทำการ: 09:00 - 18:00 น. (ทุกวัน)\n\n"
            "เจ้าหน้าที่จะรีบดูแลให้เร็วที่สุดครับ หวังว่าจะได้ร่วมเดินทางกันอีกครั้งนะครับ! 🌿"
        )

    return {
        "response_type": "text",
        "response_content": content,
        "response_meta": meta,
    }


# ---------------- Friendly Agent ----------------

def friendly_agent(user_text, history=None, reply_language: str | None = None):

    prior = _prior_turns_for_classifier(history)
    hist_block = _format_stored_history_for_prompt(prior)
    message = f"Latest user message:\n{user_text}\n\nPrior conversation (oldest first):\n{hist_block}"
    system = build_friendly_system_prompt(reply_language or "th")

    response = llm_fast.invoke([
        {"role": "system", "content": system},
        {"role": "user", "content": message},
    ])

    return response.content.strip()


# ---------------- Admin Agent ----------------

def admin_agent(user_text: str, history=None, line_user=None, reply_language: str | None = None):

    # --- Tool Definition ---
    @tool("get_my_trips")
    def get_my_trips_tool() -> str:
        """ดูประวัติทริปของฉัน"""
        return get_my_trips.invoke({"line_user_id": line_user.line_user_id if line_user else ""})

    tools = [
        get_trips,
        get_date,
        get_equipments,
        get_my_trips_tool,
    ]


    # agent = create_react_agent(
    #     llm_answer,
    #     tools,
    #     prompt=build_trip_system_prompt(reply_language or "th"),
    # )

    agent = create_agent(
        model=llm_answer,
        tools=tools,
        system_prompt=build_trip_system_prompt(reply_language or "th"),
    )



    invoke_messages = _messages_for_admin_agent(user_text, history)
    result = agent.invoke({"messages": invoke_messages})

    # --- Debug Tool calls ---
    for msg in result["messages"]:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for tc in msg.tool_calls:
                print(f"DEBUG [Admin Agent]: Tool Call -> {tc['name']}({tc['args']})")
        if isinstance(msg, ToolMessage):
            print(f"DEBUG [Admin Agent]: Tool Output -> {str(msg.content)[:200]}...")


    raw_out = _extract_last_ai_text(result["messages"][-1].content)
    payload = _coerce_llm_response_envelope(raw_out)

    return json.dumps(payload, ensure_ascii=False)


# ---------------- Payment Verify ----------------

def payment_verify_agent(user_id: str, user_slip_b64: str):

    image_data_url = f"data:image/jpeg;base64,{user_slip_b64}"

    response = llm_fast.invoke([
        {"role": "system", "content": PAYMENT_VERIFY_SYSTEMPROMPT},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": f"User {user_id} uploaded this slip"},
                {"type": "image_url", "image_url": {"url": image_data_url}},
            ],
        },
    ])

    return response.content.strip().lower()


# ---------------- Trip Summary ----------------

def trip_detail_agent(trip_id: str):

    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        return "ไม่พบข้อมูลทริปนี้"
    if not trip.is_active:
        return "ไม่พบข้อมูลทริปนี้"

    message = f"""
Trip name: {trip.name}
Province: {trip.province}
Date: {trip.start_date} - {trip.end_date}
Price: {trip.price_per_person}
Description: {trip.description}
"""

    response = llm_fast.invoke([
        {"role": "system", "content": "สรุปทริปให้น่าสนใจและอ่านง่าย"},
        {"role": "user", "content": message},
    ])

    return response.content.strip()


# ---------------- Orchestrator ----------------

from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class AgentState(TypedDict, total=False):
    user_text: str
    history: Any
    line_user: Any
    intent: str
    reply_language: str
    response: Dict[str, Any]

def classify_node(state: AgentState):
    intent, reply_language = classify_agent(state.get("user_text"), state.get("history"))
    print(f"DEBUG [Classify]: intent={intent}, lang={reply_language}")
    return {"intent": intent, "reply_language": reply_language}

def route_intent(state: AgentState):
    intent = state.get("intent")
    if intent == "admin_chat":
        return "admin_chat"
    if intent == "cancel_chat":
        return "cancel_chat"
    return "friendly_chat"

def friendly_node(state: AgentState):
    print("DEBUG [Node]: Entering Friendly Chat")
    out = friendly_agent(
        state.get("user_text"),
        state.get("history"),
        state.get("reply_language"),
    )
    return {"response": {
        "response_type": "text",
        "response_content": out,
        "response_meta": {
            "intent": "friendly_chat",
            "reply_language": state.get("reply_language"),
        },
    }}

def admin_node(state: AgentState):
    print("DEBUG [Node]: Entering Admin Chat (Tools)")
    result = admin_agent(
        state.get("user_text"),
        state.get("history"),
        state.get("line_user"),
        state.get("reply_language"),
    )
    parsed = json.loads(result)
    meta = parsed.get("response_meta") or {}
    meta["reply_language"] = state.get("reply_language")
    meta["intent"] = "admin_chat"
    parsed["response_meta"] = meta
    return {"response": parsed}


def cancel_node(state: AgentState):
    print("DEBUG [Node]: Entering Cancel Chat (auto)")
    resp = _cancel_chat_response(state.get("line_user"), state.get("reply_language"))
    meta = resp.get("response_meta") if isinstance(resp.get("response_meta"), dict) else {}
    meta["intent"] = "cancel_chat"
    meta["reply_language"] = state.get("reply_language")
    resp["response_meta"] = meta
    return {"response": resp}


def feedback_analysis_node(state: AgentState):
    return {"response": {
        "response_type": "feedback_analysis",
        "response_content": "กำลังวิเคราะห์ความเห็น",
        "response_meta": {},
    }}

workflow = StateGraph(AgentState)
workflow.add_node("classify", classify_node)
workflow.add_node("friendly_chat", friendly_node)
workflow.add_node("admin_chat", admin_node)
workflow.add_node("cancel_chat", cancel_node)

workflow.add_edge(START, "classify")
workflow.add_conditional_edges(
    "classify",
    route_intent,
    {
        "friendly_chat": "friendly_chat",
        "admin_chat": "admin_chat",
        "cancel_chat": "cancel_chat",
    },
)
workflow.add_edge("friendly_chat", END)
workflow.add_edge("admin_chat", END)
workflow.add_edge("cancel_chat", END)

app_workflow = workflow.compile()


def run_agent(user_text: str, history=None, line_user=None) -> Dict[str, Any]:

    model_used = getattr(llm_answer, "model_name", getattr(llm_answer, "model", "Unknown"))
    provider = "Google" if isinstance(llm_answer, ChatGoogleGenerativeAI) else "OpenAI"
    
    print(f"\n{'='*50}")
    print(f"🤖 กำลังใช้งาน Model: {model_used} ({provider})")
    print(f"👤 ผู้ใช้: {user_text}")

    logger.info(f"User message: {user_text}")

    initial_state = {
        "user_text": user_text,
        "history": history,
        "line_user": line_user,
    }

    if history:
        print(f"DEBUG [History]: {len(history)} messages (oldest → newest)")
        for i, m in enumerate(history):
            preview = _extract_last_ai_text(getattr(m, "content", ""))
            if isinstance(preview, str):
                preview = _strip_line_meta_json_suffix(preview)
            preview = (preview or "").replace("\n", " ")[:160]
            print(f"  [{i}] {type(m).__name__}: {preview}…")
    else:
        print("DEBUG [History]: (empty)")

    result = app_workflow.invoke(initial_state)
    response = _unwrap_accidental_json_in_response_content(result["response"])

    rm = response.get("response_meta") if isinstance(response.get("response_meta"), dict) else {}
    print(f"📍 intent={rm.get('intent')}  reply_language={rm.get('reply_language')}")

    ai_response = response.get("response_content", "")
    print(f"💬 AI: {ai_response}")
    print(f"{'='*50}\n")

    return response


# ---------------- Summary Generator ----------------

def analyze_reviews():
    from .models import Rating, Summary
    import json
    
    ratings = list(Rating.objects.all())
    total = len(ratings)
    if total == 0:
        return Summary.objects.create()

    avg = sum(r.service_rating for r in ratings) / total
    
    counts = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for r in ratings:
        if 1 <= r.service_rating <= 5:
            counts[r.service_rating] += 1
            
    stats = []
    for star in [5, 4, 3, 2, 1]:
        cnt = counts[star]
        stats.append({
            "stars": star,
            "count": cnt,
            "percentage": round(cnt / total * 100) if total else 0
        })
        
    pos = sum(1 for r in ratings if r.service_rating >= 4)
    neu = sum(1 for r in ratings if r.service_rating == 3)
    neg = sum(1 for r in ratings if r.service_rating <= 2)
    
    comments = [r.comment for r in ratings if r.comment and r.comment.strip()][:50]
    data = {"issues": [], "suggestion": "พยายามรักษามาตรฐานบริการอย่างต่อเนื่อง", "faqs": []}
    
    if comments:
        text_feed = "\n".join(f"- {c}" for c in comments)
        try:
            resp = llm_fast.invoke([
                {"role": "system", "content": "You are a customer feedback analyzer. Analyze the given comments in Thai. Output exactly valid JSON with keys: 'issues'[array of {title, description, severity(critical/warning), mentions(int)}], 'suggestion'(str), and 'faqs'[array of {question, answer}]."},
                {"role": "user", "content": f"Comments:\n{text_feed}"}
            ])
            extracted = json.loads(_strip_json_code_fence(resp.content))
            data["issues"] = extracted.get("issues", [])
            data["suggestion"] = extracted.get("suggestion", "")
            data["faqs"] = extracted.get("faqs", [])
        except Exception as e:
            logger.error(f"LLM parse error: {e}")

    return Summary.objects.create(
        total_reviews=total,
        average_rating=round(avg, 2),
        ratings_stats=stats,
        positive_count=pos,
        positive_percentage=round(pos / total * 100),
        neutral_count=neu,
        neutral_percentage=round(neu / total * 100),
        negative_count=neg,
        negative_percentage=round(neg / total * 100),
        issues=data.get("issues", []),
        suggestion=data.get("suggestion", ""),
        faqs=data.get("faqs", [])
    )