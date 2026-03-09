from django.contrib import admin
from .models import (
    User,
    Trip,
    Booking,
    Payment,
    Equipment,
    BookingEquipment,
    ChatbotSession,
    LineUser,
    LineMessage,
    Customer,
    Admin,
)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'role']
    list_filter = ['role']
    search_fields = ['name', 'phone']

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['user', 'id_number']
    search_fields = ['user__name', 'user__phone', 'id_number']
    
@admin.register(Admin)
class AdminModelAdmin(admin.ModelAdmin):
    list_display = ['user', 'position', 'employee_id']
    search_fields = ['user__name', 'position', 'employee_id']

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'category', 'province', 'price_per_person', 'capacity', 'start_date', 'end_date']
    list_filter = ['location', 'category', 'province', 'start_date']
    search_fields = ['name', 'description', 'province']
    date_hierarchy = 'start_date'

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['trip', 'customer', 'group_size', 'total_price', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['trip__name', 'customer__name']
    date_hierarchy = 'created_at'

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['booking', 'amount', 'payment_method', 'payment_status', 'slip_uploaded_at', 'verified_by', 'paid_at']
    list_filter = ['payment_method', 'payment_status', 'slip_uploaded_at', 'verified_at']
    search_fields = ['booking__trip__name', 'transaction_id']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'price']
    search_fields = ['name']

@admin.register(BookingEquipment)
class BookingEquipmentAdmin(admin.ModelAdmin):
    list_display = ['booking', 'equipment', 'quantity', 'total_price']

@admin.register(ChatbotSession)
class ChatbotSessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user', 'intent', 'created_at']
    list_filter = ['intent', 'created_at']
    search_fields = ['query', 'response']
    date_hierarchy = 'created_at'
    readonly_fields = ['session_id']

@admin.register(LineUser)
class LineUserAdmin(admin.ModelAdmin):
    list_display = ['line_user_id', 'display_name', 'language', 'created_at']
    list_filter = ['language', 'created_at']
    search_fields = ['line_user_id', 'display_name']
    date_hierarchy = 'created_at'
    readonly_fields = ['line_user_id', 'created_at', 'updated_at']

@admin.register(LineMessage)
class LineMessageAdmin(admin.ModelAdmin):
    list_display = ['line_user', 'message_type', 'direction', 'content_preview', 'processed', 'timestamp']
    list_filter = ['message_type', 'direction', 'processed', 'timestamp']
    search_fields = ['content', 'ai_response', 'line_user__display_name']
    date_hierarchy = 'timestamp'
    readonly_fields = ['message_id', 'timestamp', 'created_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'