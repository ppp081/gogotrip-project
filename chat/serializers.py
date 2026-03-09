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
    image_base64 = serializers.SerializerMethodField()

    class Meta:
        model = Image
        fields = [
            'id', 'trip', 'image_url', 'image_type',
            'image_thumbnail', 'created_at', 'image_base64'
        ]

    def get_image_base64(self, obj):
        if obj.image_data:
            base64_str = base64.b64encode(obj.image_data).decode('utf-8')
            return f"data:image/jpeg;base64,{base64_str}"
        return None


class TripSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    category_label = serializers.CharField(source='get_category_display', read_only=True)
    thumbnail_image = serializers.SerializerMethodField()
    images = ImageSerializer(many=True, read_only=True)

    class Meta:
        model = Trip
        fields = [
            'id', 'name', 'description', 'content', 'location', 'province', 'country',
            'price_per_person', 'capacity', 'start_date', 'end_date',
            'category', 'category_label',
            'created_by', 'created_by_name',
            'thumbnail_image', 'images', 'created_at'
        ]

    def get_thumbnail_image(self, obj):
        request = self.context["request"]
        thumbnail = obj.images.filter(image_thumbnail=True).first()
        if not thumbnail:
            return None
        return request.build_absolute_uri(f"/api/images/{thumbnail.id}/file/")



class BookingSerializer(serializers.ModelSerializer):
    trip_name = serializers.CharField(source='trip.name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'trip', 'trip_name', 'customer', 'customer_name',
            'group_size', 'total_price', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'trip_name', 'customer_name']

class PaymentSerializer(serializers.ModelSerializer):
    booking_info = BookingSerializer(source='booking', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.name', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'booking', 'booking_info', 'amount', 'payment_method',
            'payment_status', 'slip_image', 'slip_uploaded_at', 
            'verified_by', 'verified_by_name', 'verified_at', 'verification_notes',
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
