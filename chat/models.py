import uuid
from django.db import models
from django.utils import timezone



class User(models.Model):
    class Role(models.TextChoices):
        ADMIN = "admin"
        CUSTOMER = "customer"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    role = models.CharField(max_length=20, choices=Role.choices)
    
    def __str__(self):
        return self.name

class Customer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="customer", primary_key=True)
    id_number = models.CharField(max_length=20, unique=True)  # เก็บเลขบัตรประชาชน
    
    def __str__(self):
        return self.user.name

class Admin(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="admin", primary_key=True)
    position = models.CharField(max_length=100)  # ตำแหน่งงานของ Admin
    employee_id = models.CharField(max_length=20, unique=True)  # รหัสพนักงานสำหรับ Admin
    
    def __str__(self):
        return self.user.name

class Rating(models.Model):
    """การให้คะแนนหลังจบทริป"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey('Trip', on_delete=models.CASCADE, related_name='ratings')
    booking_id = models.UUIDField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings')
    trip_rating = models.PositiveSmallIntegerField()
    service_rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.user.name} → {self.trip.name} ({self.trip_rating}/5)"


class Image(models.Model):
    """หลายรูปต่อ 1 ทริป แต่มีได้ภาพปกเพียง 1 ภาพ"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey('Trip', on_delete=models.CASCADE, related_name='images')
    image_url = models.TextField(blank=True, null=True)
    image_data = models.BinaryField(blank=True, null=True)
    image_type = models.CharField(max_length=50, blank=True, null=True, help_text="เช่น hero, gallery, thumbnail")
    image_thumbnail = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        if self.image_thumbnail:
            Image.objects.filter(trip=self.trip, image_thumbnail=True).exclude(id=self.id).update(image_thumbnail=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.trip.name} - {'Thumbnail' if self.image_thumbnail else (self.image_type or 'Image')}"


class Trip(models.Model):
    """Travel package that can be booked and extended with rich content sections."""
    class Location(models.TextChoices):
        NORTH = "north"
        CENTRAL = "central"
        NORTHEAST = "northeast"
        WEST = "west"
        EAST = "east"
        SOUTH = "south"

    class Category(models.TextChoices):
        TRENDING = "trending", "ทริปมาแรง"
        YOUTUBER = "youtuber", "ทริปตามรอย Youtuber"
        CULTURAL = "cultural", "ทริปเชิงวัฒนธรรม"
        ONE_DAY = "one_day", "เที่ยววันเดียว"
        TREKKING = "trekking", "ทริปเดินป่า"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()
    content = models.TextField(default="")
    location = models.CharField(max_length=20, choices=Location.choices)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.TRENDING)
    province = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default="Thailand")
    price_per_person = models.DecimalField(max_digits=10, decimal_places=2)
    capacity = models.IntegerField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trips_created')
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.name} ({self.province})"

class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending"
        CONFIRMED = "confirmed"
        CANCELLED = "cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE)
    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    group_size = models.IntegerField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices)
    created_at = models.DateTimeField(default=timezone.now)

class Payment(models.Model):
    class Method(models.TextChoices):
        CREDIT_CARD = "credit_card"
        BANK_TRANSFER = "bank_transfer"
        CASH = "cash"
        MOBILE_BANKING = "mobile_banking"
        QR_CODE = "qr_code"

    class Status(models.TextChoices):
        PENDING = "pending"  # รอการชำระ
        SLIP_UPLOADED = "slip_uploaded"  # อัพโหลดสลิปแล้ว
        VERIFYING = "verifying"  # กำลังตรวจสอบ
        PAID = "paid"  # ชำระเรียบร้อย
        FAILED = "failed"  # ชำระไม่สำเร็จ
        REFUNDED = "refunded"  # คืนเงินแล้ว

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=Method.choices)
    payment_status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Payment slip information
    slip_image = models.ImageField(upload_to='payment_slips/', null=True, blank=True)
    slip_uploaded_at = models.DateTimeField(null=True, blank=True)
    
    # Payment verification
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_payments')
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(blank=True)
    
    # Transaction details
    transaction_id = models.CharField(max_length=100, blank=True)
    bank_account = models.CharField(max_length=50, blank=True)
    
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.id} - {self.booking.trip.name} - {self.payment_status}"

class Equipment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)

class BookingEquipment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

class ChatbotSession(models.Model):
    session_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    query = models.TextField()
    response = models.TextField()
    intent = models.CharField(max_length=100)
    created_at = models.DateTimeField(default=timezone.now)

class LineUser(models.Model):
    """Model for LINE users"""
    line_user_id = models.CharField(max_length=255, unique=True, primary_key=True)
    display_name = models.TextField(blank=True)
    picture_url = models.TextField(blank=True)
    status_message = models.TextField(blank=True)
    user_status = models.CharField(max_length=50, blank=True)
    user_metadata = models.JSONField(default=dict, blank=True)
    language = models.CharField(max_length=10, default='th')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="line_accounts",
    )


    def __str__(self):
        return f"{self.display_name} ({self.line_user_id})"

class LineMessage(models.Model):
    """Model to store LINE messages"""
    class MessageType(models.TextChoices):
        TEXT = "text"
        IMAGE = "image"
        VIDEO = "video"
        AUDIO = "audio"
        STICKER = "sticker"
        LOCATION = "location"
        
    class Direction(models.TextChoices):
        INCOMING = "incoming"  # จากลูกค้า
        OUTGOING = "outgoing"  # ตอบกลับ
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    line_user = models.ForeignKey(LineUser, on_delete=models.CASCADE)
    message_id = models.CharField(max_length=100, unique=True)  # LINE message ID
    message_type = models.CharField(max_length=20, choices=MessageType.choices)
    direction = models.CharField(max_length=20, choices=Direction.choices)
    content = models.TextField()  # ข้อความหรือ URL ของไฟล์
    reply_token = models.CharField(max_length=100, blank=True)
    timestamp = models.DateTimeField()
    created_at = models.DateTimeField(default=timezone.now)
    
    # เชื่อมกับ AI response
    ai_response = models.TextField(blank=True)
    processed = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.line_user.display_name}: {self.content[:50]}..."
