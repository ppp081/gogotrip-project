"""
Serializers for API responses
"""
from rest_framework import serializers
import base64
from .models import (
    LineUser,
    LineMessage,
    ChatbotSession,
    User,
    Trip,
    Booking,
    Payment,
    Equipment,
    Customer,
    Admin,
    Image,
    BookingEquipment,
    Rating,
    Summary,
    Notification,
)

class LineUserSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = LineUser
        fields = [
            'line_user_id', 'display_name', 'picture_url', 'status_message', 'user_status',
            'language', 'created_at', 'updated_at', 'message_count', 'last_message'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_message_count(self, obj):
        return obj.linemessage_set.count()
    
    def get_last_message(self, obj):
        last_msg = obj.linemessage_set.first()
        if last_msg:
            return {
                'content': last_msg.content[:100],
                'timestamp': last_msg.timestamp,
                'direction': last_msg.direction
            }
        return None

class LineMessageSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='line_user.display_name', read_only=True)
    
    class Meta:
        model = LineMessage
        fields = [
            'id', 'line_user', 'user_name', 'message_id', 'message_type',
            'direction', 'content', 'reply_token', 'timestamp', 'created_at',
            'ai_response', 'processed'
        ]
        read_only_fields = ['id', 'created_at', 'user_name']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'phone', 'role']

class CustomerSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = Customer
        fields = ['user', 'id_number']
    def create(self, validated_data):
        user_data = validated_data.pop("user")   # <-- เอา dict ออกมาก่อน
        user = User.objects.create(**user_data)  # <-- สร้าง User instance
        return Customer.objects.create(user=user, **validated_data)

class AdminSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = Admin
        fields = ['user', 'position', 'employee_id']
    def create(self, validated_data):
        user_data = validated_data.pop("user")   # <-- เอา dict ออกมาก่อน
        user = User.objects.create(**user_data)  # <-- สร้าง User instance
        return Admin.objects.create(user=user, **validated_data)

class ChatbotSessionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = ChatbotSession
        fields = [
            'session_id', 'user', 'user_name', 'query', 'response',
            'intent', 'created_at'
        ]
        read_only_fields = ['session_id', 'created_at', 'user_name']


class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = [
            'id', 'trip', 'image_url', 'image_type',
            'image_thumbnail', 'created_at'
        ]


class TripSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source='get_category_display', read_only=True)
    thumbnail_image = serializers.SerializerMethodField()
    images = ImageSerializer(many=True, read_only=True)

    class Meta:
        model = Trip
        fields = [
            'id', 'name', 'description', 'content', 'location', 'province', 'country',
            'price_per_person', 'capacity', 'start_date', 'end_date',
            'category', 'category_label',
            'is_active',
            'thumbnail_image', 'images', 'created_at'
        ]

    def get_thumbnail_image(self, obj):
        thumbnail = obj.images.filter(image_thumbnail=True).first()
        if not thumbnail:
            return None
        return thumbnail.image_url



class BookingSerializer(serializers.ModelSerializer):
    trip_name = serializers.CharField(source='trip.name', read_only=True)
    trip_province = serializers.CharField(source='trip.province', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    line_display = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'trip', 'trip_name', 'trip_province', 'customer', 'customer_name',
            'customer_phone', 'line_display',
            'group_size', 'total_price', 'status', 'created_at',
        ]
        read_only_fields = [
            'id', 'created_at', 'trip_name', 'trip_province', 'customer_name',
            'customer_phone', 'line_display',
        ]

    def get_line_display(self, obj):
        cust = getattr(obj, "customer", None)
        if not cust:
            return None
        first = cust.line_accounts.first()
        if not first:
            return None
        name = (first.display_name or "").strip()
        return name or str(first.line_user_id)

class PaymentSerializer(serializers.ModelSerializer):
    booking_info = BookingSerializer(source='booking', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'booking', 'booking_info', 'amount', 'payment_method',
            'payment_status', 'payment_url',
            'transaction_id', 'bank_account', 'paid_at', 'created_at', 'updated_at'
        ]

class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = ['id', 'name', 'price']

class BookingEquipmentSerializer(serializers.ModelSerializer):
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)
    
    class Meta:
        model = BookingEquipment
        fields = ['id', 'booking', 'equipment', 'equipment_name', 'quantity', 'total_price']

class RatingSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = Rating
        fields = [
            'id', 'trip', 'user', 'user_name', 'booking_id',
            'service_rating', 'comment', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'user_name']


class NotificationSerializer(serializers.ModelSerializer):
    """ข้อมูลจริงจาก DB (Booking → Trip / User) — payload เป็น snapshot เสริม"""

    trip_name = serializers.CharField(source='booking.trip.name', read_only=True)
    trip_province = serializers.CharField(source='booking.trip.province', read_only=True)
    customer_name = serializers.CharField(source='booking.customer.name', read_only=True)
    booking_status = serializers.CharField(source='booking.status', read_only=True)
    booking_total = serializers.DecimalField(
        source='booking.total_price', max_digits=12, decimal_places=2, read_only=True
    )
    group_size = serializers.IntegerField(source='booking.group_size', read_only=True)
    read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'booking', 'payload', 'read_at', 'created_at', 'read',
            'trip_name', 'trip_province', 'customer_name', 'booking_status',
            'booking_total', 'group_size',
        ]
        read_only_fields = fields

    def get_read(self, obj):
        return obj.read_at is not None


class SummarySerializer(serializers.ModelSerializer):
    sentiment = serializers.SerializerMethodField()

    class Meta:
        model = Summary
        fields = [
            'id', 'total_reviews', 'average_rating',
            'sentiment', 'highlights', 'issues', 'suggestion', 'suggestion_bullets',
            'faqs', 'ratings_stats', 'created_at',
        ]
        read_only_fields = fields

    def get_sentiment(self, obj):
        return {
            "positive": {"count": obj.positive_count, "percentage": obj.positive_percentage},
            "neutral": {"count": obj.neutral_count, "percentage": obj.neutral_percentage},
            "negative": {"count": obj.negative_count, "percentage": obj.negative_percentage},
        }
