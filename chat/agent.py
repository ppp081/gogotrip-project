from __future__ import annotations
import os
import logging
from typing import Dict, Any
import json

from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import JsonOutputParser
from .models import *
import json
from pydantic import BaseModel, Field
from langchain.tools import tool



class LLM_Response(BaseModel):
    """Unified schema for chatbot output"""
    response_type: str = Field(description="Type of response, e.g. text, trip_list, booking_verify, error")
    response_content: str = Field(description="Main message content, plain text")
    response_meta: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata such as trips or booking info")
    

from .prompts import CLASSIFY_SYSTEMPROMPT, TRIP_SYSTEMPROMPT, FRIENDLY_SYSTEMPROMPT, PAYMENT_VERIFY_SYSTEMPROMPT
from .tools import get_trips, get_date, get_equipments

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY  = os.getenv("OPENROUTER_API_KEY")
OPENAI_API_KEY      = os.getenv("OPENAI_API_KEY")

# ---------------- LLMs ----------------
# llm_fast = ChatOpenAI(
#     openai_api_base="https://openrouter.ai/api/v1",
#     api_key=OPENROUTER_API_KEY,
#     model="openai/gpt-4o-mini",
#     temperature=0.0,
# )

# llm_answer = ChatOpenAI(
#     openai_api_base="https://openrouter.ai/api/v1",
#     api_key=OPENROUTER_API_KEY,
#     model="openai/gpt-4o-mini",
#     temperature=0.3,
# )

llm_fast = ChatOpenAI(
    model="gpt-4.1-mini",
    temperature=0.5,
)

llm_answer = ChatOpenAI(
    model="gpt-4.1-mini",
    temperature=0.5,
    model_kwargs={"response_format": {"type": "json_object"}}
)

def safe_prompt(text: str) -> str:
    return text.replace("{", "{{").replace("}", "}}")

# ---------------- Classify Agent ----------------
def classify_agent(user_text, history=None):
    message = f"Message: {user_text}\n (Conversation continues from previous messages): {history}"
    response = llm_fast.invoke([
        {"role": "system", "content": CLASSIFY_SYSTEMPROMPT},
        {"role": "user", "content": message},
    ])

    return response.content.strip().lower()

# --------------- Friendly Agent ----------------
def friendly_agent(user_text, history=None):
    message = f"Message: {user_text}\n (Conversation continues from previous messages): {history}"
    response = llm_fast.invoke([
        {"role": "system", "content": FRIENDLY_SYSTEMPROMPT},
        {"role": "user", "content": message},
    ])
    return response.content.strip().lower()



# ---------------- Admin Agent ----------------
def admin_agent(user_text: str, history=None, line_user=None):

    @tool
    def get_my_trips() -> str:
        """ดูประวัติทริปของฉัน หรือ ทริปที่ฉันเคยจอง (My booked trips history)
        ใช้เมื่อผู้ใช้ถามว่า "ทริปของฉันมีอะไรบ้าง", "ขอดูประวัติทริปหน่อย", "ทริปที่ฉันจอง"
        """
        if not line_user:
            return "ระบบไม่สามารถอ้างอิงข้อมูลผู้ใช้ได้"
        from .models import Booking
        qs = Booking.objects.filter(customer=line_user.user).select_related('trip').order_by('-created_at')
        if not qs.exists():
            return "คุณยังไม่มีประวัติการจองทริปครับ"
        rows = []
        for index, b in enumerate(qs[:10], start=1):
            rows.append(f"{index}. ทริป: {b.trip.name} (จังหวัด: {b.trip.province}) - สถานะ: {b.get_status_display()}")
        return "ประวัติทริปของคุณมีดังนี้:\n" + "\n".join(rows)

    tools = [get_trips, get_date, get_equipments, get_my_trips]
    output_parser = JsonOutputParser()

    prompt = ChatPromptTemplate.from_messages([
        ("system", safe_prompt(TRIP_SYSTEMPROMPT)  + "\n\n" + output_parser.get_format_instructions()),
        MessagesPlaceholder("chat_history", optional=True),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])

    agent = create_openai_tools_agent(llm_answer, tools, prompt)
    executor = AgentExecutor(agent=agent, tools=tools, verbose=True, max_iterations=5)

    result = executor.invoke({
        "input": user_text,
        "chat_history": history or [],
        "agent_scratchpad": [],
    })

    raw_output = result.get("output", "").strip()
    try:
        start = raw_output.find("{")
        end = raw_output.rfind("}") + 1
        json_segment = raw_output[start:end]
        parsed = output_parser.parse(json_segment)
        return json.dumps(parsed, ensure_ascii=False)
    except Exception as e:
        print(f"[AdminAgent] JSON parse error: {e}")
        return json.dumps({
            "response_type": "error",
            "response_content": "ระบบไม่สามารถแปลงผลลัพธ์เป็น JSON ได้",
            "response_meta": {}
        }, ensure_ascii=False)
    

def payment_verify_agent(user_id: str, user_slip_b64: str):
    """Analyze payment slip using multimodal LLM (image input)."""
    image_data_url = f"data:image/jpeg;base64,{user_slip_b64}"

    response = llm_fast.invoke([
        {"role": "system", "content": PAYMENT_VERIFY_SYSTEMPROMPT},
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"User {user_id} uploaded this image. Determine if it is a Thai bank transfer slip."
                },
                {
                    "type": "image_url",
                    "image_url": {"url": image_data_url},
                },
            ],
        },
    ])
    return response.content.strip().lower()

# --------------------- Trip Summarize Agent
def trip_detail_agent(trip_id: str):
    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        return "ไม่พบข้อมูลทริปนี้ในระบบครับ"

    message = (
        f"Trip id: {trip.id}\n"
        f"Trip name: {trip.name}\n"
        f"Province: {trip.province}\n"
        f"Category: {trip.category}\n"
        f"Date: {trip.start_date:%d/%m/%Y} - {trip.end_date:%d/%m/%Y}\n"
        f"Price per person: {trip.price_per_person:,.0f} บาท\n"
        f"Description: {trip.description}\n"
        f"Content: {trip.content}\n\n"
        f"(User wants a natural, friendly summary for this trip.)"
    )

    response = llm_fast.invoke([
        {
            "role": "system",
            "content": (
                "คุณคือผู้ช่วยท่องเที่ยวของ Gogo Trip พูดด้วยน้ำเสียงเป็นมิตร กระชับ ชวนให้ไปเที่ยว\n"
                "เขียนเป็นย่อหน้าเดียว ไม่เกิน 8–10 บรรทัด\n"
                "ต้องมีข้อมูล: สถานที่ / ไฮไลต์ / ระยะเวลา / ราคา / เหมาะกับใคร / บรรยากาศ\n"
                "ใช้ emoji ได้ แต่ไม่เกิน 6 อัน และห้ามใช้ในบรรทัดสุดท้าย\n"
                "ห้ามใส่ลิงก์ไว้ในเนื้อความหลัก ให้ปิดท้ายด้วย footer แยกบรรทัดแบบนี้เท่านั้น:\n"
                "\n"
                "---\n"
                "ดูรายละเอียดทริปสิผ่าน https://tripbot-frontend-294086862024.asia-southeast1.run.app/blog/{{trip_id}}\n"
                "---\n"
                "\n"
                "ตัวแปร {{trip_id}} คือ slug ที่ backend ส่งมา ห้ามเปลี่ยนแปลงหรือใส่ชื่อทริปแทน"
            )
        },
        {"role": "user", "content": message},
    ])

    return response.content.strip()


# ---------------- Orchestrator ----------------
def run_agent(user_text: str, history=None, line_user=None) -> Dict[str, Any]:
    logger.error(f"[Orchestrator] Step #1 Get User Message {user_text}\n")
    logger.error(f"[Orchestrator] Step #1 Get User History {history}\n")
    msg_intent = classify_agent(user_text, history)
    
    if msg_intent == "friendly_chat":
        out = friendly_agent(user_text, history)
        return {
            "response_type": "text",
            "response_content": out,
            "response_meta": {"intent": "friendly_chat"}
        }
    if msg_intent == "admin_chat":
        result = admin_agent(user_text, history, line_user)
        return json.loads(result)


    
    return {
        "response_type": "error",
        "response_content": "ไม่เข้าใจครับ",
        "response_meta": {"intent": "unknown"}
    }
