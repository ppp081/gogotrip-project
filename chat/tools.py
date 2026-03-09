
# ---------- Standard Library ----------
from datetime import datetime, timedelta
from typing import Optional

# ---------- Third-Party Libraries ----------
import pytz
from dateutil.relativedelta import relativedelta

# ---------- Django ----------
from django.db.models import Q, Sum, Case, When, IntegerField, Value, F
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.conf import settings


# ---------- LangChain ----------
from langchain.tools import tool

# ---------- Project ----------
from .models import Trip, Booking, Payment, Equipment
LINE_CHANNEL_NGROK_BASE = settings.LINE_CHANNEL_NGROK_BASE
THAI_MONTHS = {
    'January': 'มกราคม',
    'February': 'กุมภาพันธ์',
    'March': 'มีนาคม',
    'April': 'เมษายน',
    'May': 'พฤษภาคม',
    'June': 'มิถุนายน',
    'July': 'กรกฎาคม',
    'August': 'สิงหาคม',
    'September': 'กันยายน',
    'October': 'ตุลาคม',
    'November': 'พฤศจิกายน',
    'December': 'ธันวาคม'
}
# ----------- Trip Tool -----------

@tool("get_trips")
def get_trips(
    query: str = "",
    trip_id: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_date: Optional[str] = None,
    max_date: Optional[str] = None,
    category_type: Optional[str] = None,
    province: Optional[str] = None,
    location: Optional[str] = None,
    limit: int = 10,
) -> dict:
    """ค้นหาทริป โดยกรองตามชื่อ จังหวัด ประเภท ภูมิภาค ราคา และช่วงเวลาเดินทาง"""

    qs = (
        Trip.objects
        .annotate(confirmed_sum=Coalesce(Sum(
            Case(
                When(booking__status=Booking.Status.CONFIRMED, then="booking__group_size"),
                default=Value(0),
                output_field=IntegerField(),
            )
        ), 0))
        .annotate(seats_left=F("capacity") - F("confirmed_sum"))
        .filter(start_date__gt=timezone.now())
    )

    if query:
        qs = qs.filter(
            Q(name__icontains=query)
            | Q(description__icontains=query)
            | Q(province__icontains=query)
            | Q(location__icontains=query)
        )
    if trip_id:
        qs = qs.filter(id=trip_id)
    if category_type:
        qs = qs.filter(category=category_type)
    if location:
        qs = qs.filter(location=location)
    if province:
        qs = qs.filter(province__icontains=province)
    if min_price is not None:
        qs = qs.filter(price_per_person__gte=min_price)
    if max_price is not None:
        qs = qs.filter(price_per_person__lte=max_price)
    if min_date:
        try:
            min_dt = timezone.make_aware(datetime.strptime(min_date, "%Y-%m-%d"))
            qs = qs.filter(start_date__gte=min_dt)
        except Exception:
            pass
    if max_date:
        try:
            max_dt = timezone.make_aware(datetime.strptime(max_date, "%Y-%m-%d"))
            qs = qs.filter(end_date__lte=max_dt)
        except Exception:
            pass

    if not qs.exists():
        return {
            "response_type": "text",
            "response_content": "ยังไม่มีทริปที่ตรงกับเงื่อนไขตอนนี้ครับ",
            "response_meta": {}
        }

    trips_data = []
    for t in qs.order_by("start_date")[:limit]:

        thumbnail = t.images.filter(image_thumbnail=True).first()
        img_url = f"{LINE_CHANNEL_NGROK_BASE}/api/images/{thumbnail.id}/file/" if thumbnail else "https://www.shutterstock.com/image-vector/remote-work-black-white-error-260nw-2352059897.jpg"
        # print(img_url)
        
        trips_data.append({
            "trip_id": str(t.id),
            "trip_name": t.name,
            "trip_province": t.province,
            "trip_description": t.description,
            "trip_price_per_person": f"{int(t.price_per_person):,}",
            "trip_date": f"{t.start_date.strftime('%d %B')} - {t.end_date.strftime('%d %B')}",
            "trip_date": f"{t.start_date.strftime('%d')} {THAI_MONTHS[t.start_date.strftime('%B')]} - {t.end_date.strftime('%d')} {THAI_MONTHS[t.end_date.strftime('%B')]}",
            "trip_time": f"{t.start_date.strftime('%H:%M')} - {t.end_date.strftime('%H:%M')}",
            "trip_image_url": img_url,
        })

    return {
        "response_type": "trip_list",
        "response_content": f"พบทริปทั้งหมด {qs.count()} รายการ (แสดง {len(trips_data)} รายการแรก)",
        "response_meta": {"trips": trips_data}
    }

# ----------- Get Equipment -----------
@tool("get_equipments")
def get_equipments() -> dict:
    """get equipment"""
    qs = Equipment.objects.all().order_by("name")
    data = [
        {
            "equipment_id": str(e.id),
            "equipment_name": e.name,
            "equipment_price": float(e.price),
        }
        for e in qs
    ]
    print(f"[DEBUG]: Trip Equipment: {data}")
    return {
        "response_type": "equipment_list",
        "response_meta": {"equipments": data}
    }



# ----------- Get Date Tool -----------
@tool("get_date")
def get_date(unit: Optional[str] = "days", amount: Optional[int] = 0, base_date: Optional[str] = "") -> str:
    """Calculate a date by adding/subtracting a time unit from a base date."""
    tz = pytz.timezone("Asia/Bangkok")

    if base_date:
        try:
            base = datetime.strptime(base_date, "%Y-%m-%d")
            base = tz.localize(base)
        except ValueError:
            return "Invalid base_date format. Use YYYY-MM-DD."
    else:
        base = datetime.now(tz)

    if unit == "days":
        result_date = base + timedelta(days=amount)
    elif unit == "weeks":
        result_date = base + timedelta(weeks=amount)
    elif unit == "months":
        result_date = base + relativedelta(months=amount)
    elif unit == "years":
        result_date = base + relativedelta(years=amount)
    else:
        return "Invalid unit. Use 'days', 'weeks', 'months', or 'years'."

    return result_date.strftime("%Y-%m-%d")

  


# ----------- Booking Tool -----------
@tool("create_bookings")
def create_bookings() -> str:
    """Find bookings avaliable with optional details."""
    # ก่อนจะใช้ tool นี้ ต้องเช็คก่อนว่ามี avaliable trip ที่พูดถึงไหม
    # step 1 get trip avaliable by context
    # step 2.1 if trip avaliable response with this format
    # step 2.2 if not trip avaliable response with 


# ----------- Payment Tool -----------
@tool("get_payments")
def get_payments(status: Optional[str] = "") -> str:
    """Find payments, optionally filter by status (e.g., paid, pending)."""
    qs = Payment.objects.all()
    if status:
        qs = qs.filter(payment_status__icontains=status)

    rows = []
    for p in qs[:5]:
        rows.append(
            f"- {p.booking.trip.name} ฿{p.amount} [{p.payment_status}] "
            f"method={p.payment_method}"
        )
    return "\n".join(rows) if rows else "ไม่พบการชำระเงิน"
