from __future__ import annotations

import os
import httpx
import json
import logging
from typing import Any, Dict, Literal
from .models import Booking

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
    intent: Literal["admin_chat", "friendly_chat"] = Field(
        description="admin_chat = trips/bookings/tools; friendly_chat = chit-chat"
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
    if state.get("intent") == "admin_chat":
        return "admin_chat"
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

workflow.add_edge(START, "classify")
workflow.add_conditional_edges(
    "classify",
    route_intent,
    {
        "friendly_chat": "friendly_chat",
        "admin_chat": "admin_chat",
    },
)
workflow.add_edge("friendly_chat", END)
workflow.add_edge("admin_chat", END)

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

    ai_response = response.get("response_content", "")
    print(f"💬 AI: {ai_response}")
    print(f"{'='*50}\n")

    return response