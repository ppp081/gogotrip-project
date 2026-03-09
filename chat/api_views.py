"""
API Views for CRUD operations
"""


from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count, F
from django.utils import timezone
from django.http import HttpResponse, Http404
from datetime import timedelta
from .models import (
    LineUser,
    LineMessage,
    ChatbotSession,
    Trip,
    Booking,
    Payment,
    Customer,
    Admin,
    Image,
    Equipment,
    BookingEquipment,
)
from .serializers import (

    LineUserSerializer, LineMessageSerializer, ImageSerializer,
    ChatbotSessionSerializer, TripSerializer, BookingSerializer,
    PaymentSerializer, CustomerSerializer, AdminSerializer, EquipmentSerializer, 
    BookingEquipmentSerializer,
)



class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class LineUserViewSet(viewsets.ModelViewSet):
    """CRUD operations for LINE users"""
    queryset = LineUser.objects.all()
    serializer_class = LineUserSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = LineUser.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(display_name__icontains=search) | 
                Q(line_user_id__icontains=search)
            )
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages for a specific user"""
        user = self.get_object()
        messages = LineMessage.objects.filter(line_user=user).order_by('-timestamp')
        
        # Pagination
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = LineMessageSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = LineMessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get user statistics"""
        user = self.get_object()
        
        # Message counts
        total_messages = LineMessage.objects.filter(line_user=user).count()
        incoming_messages = LineMessage.objects.filter(
            line_user=user, 
            direction=LineMessage.Direction.INCOMING
        ).count()
        
        # Recent activity (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        recent_messages = LineMessage.objects.filter(
            line_user=user,
            timestamp__gte=week_ago
        ).count()
        
        return Response({
            'total_messages': total_messages,
            'incoming_messages': incoming_messages,
            'outgoing_messages': total_messages - incoming_messages,
            'recent_messages_7days': recent_messages,
            'last_activity': user.linemessage_set.first().timestamp if user.linemessage_set.exists() else None
        })

class LineMessageViewSet(viewsets.ModelViewSet):
    """CRUD operations for LINE messages"""
    queryset = LineMessage.objects.all()
    serializer_class = LineMessageSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = LineMessage.objects.select_related('line_user').all()
        
        # Filters
        user_id = self.request.query_params.get('user_id', None)
        direction = self.request.query_params.get('direction', None)
        message_type = self.request.query_params.get('type', None)
        search = self.request.query_params.get('search', None)
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if user_id:
            queryset = queryset.filter(line_user__line_user_id=user_id)
        if direction:
            queryset = queryset.filter(direction=direction)
        if message_type:
            queryset = queryset.filter(message_type=message_type)
        if search:
            queryset = queryset.filter(
                Q(content__icontains=search) |
                Q(ai_response__icontains=search) |
                Q(line_user__display_name__icontains=search)
            )
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
            
        return queryset.order_by('-timestamp')
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get message analytics"""
        # Message counts by type
        message_types = LineMessage.objects.values('message_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Messages by direction
        directions = LineMessage.objects.values('direction').annotate(
            count=Count('id')
        )
        
        # Daily message counts (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        daily_messages = LineMessage.objects.filter(
            timestamp__gte=thirty_days_ago
        ).extra(
            select={'day': 'date(timestamp)'}
        ).values('day').annotate(
            count=Count('id')
        ).order_by('day')
        
        # Top active users
        top_users = LineUser.objects.annotate(
            message_count=Count('linemessage')
        ).order_by('-message_count')[:10]
        
        return Response({
            'message_types': list(message_types),
            'directions': list(directions),
            'daily_messages': list(daily_messages),
            'top_users': LineUserSerializer(top_users, many=True).data,
            'total_messages': LineMessage.objects.count(),
            'total_users': LineUser.objects.count()
        })

class ChatbotSessionViewSet(viewsets.ModelViewSet):
    """CRUD operations for chatbot sessions"""
    queryset = ChatbotSession.objects.all()
    serializer_class = ChatbotSessionSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = ChatbotSession.objects.select_related('user').all()
        
        # Filters
        intent = self.request.query_params.get('intent', None)
        search = self.request.query_params.get('search', None)
        
        if intent:
            queryset = queryset.filter(intent=intent)
        if search:
            queryset = queryset.filter(
                Q(query__icontains=search) |
                Q(response__icontains=search)
            )
            
        return queryset.order_by('-created_at')

class ImageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Image.objects.all()
    serializer_class = ImageSerializer

    @action(detail=True, methods=['get'])
    def file(self, request, pk=None):
        img = self.get_object()
        if not img.image_data:
            raise Http404("No image file stored")
        return HttpResponse(img.image_data, content_type="image/jpeg")


class TripViewSet(viewsets.ModelViewSet):
    """CRUD operations for trips"""
    queryset = Trip.objects.all()
    serializer_class = TripSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Trip.objects.select_related('created_by')

        # Filters
        location = self.request.query_params.get('location', None)
        province = self.request.query_params.get('province', None)
        available = self.request.query_params.get('available', None)
        category = self.request.query_params.get('category', None)

        if location:
            queryset = queryset.filter(location=location)
        if province:
            queryset = queryset.filter(province__icontains=province)
        if category:
            queryset = queryset.filter(category=category)
        if available == 'true':
            # ทริปที่ยังจองได้: ยังไม่เริ่มเดินทาง
            queryset = queryset.filter(start_date__gt=timezone.now())
            
        return queryset.order_by('-start_date')
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get only available trips"""
        available_trips = Trip.objects.filter(
            start_date__gt=timezone.now()
        ).select_related('created_by').order_by('start_date')
        
        serializer = self.get_serializer(available_trips, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='task')
    def daily_trip_feedback_cron(self, request):
        """
        Cronjob รับ request ทุกวัน เพื่อเช็คว่ามี Trip ไหนที่ end_date วันนี้
        และดึงข้อมูล Booking ไปส่งข้อความ (LINE Quick Reply) ขอ feedback 
        """
        from .line_webhook import send_post_trip_feedback
        
        today = timezone.localtime().date()
        trips_today = Trip.objects.filter(end_date__date=today)
        
        count_sent = 0
        for trip in trips_today:
            bookings = Booking.objects.filter(trip=trip, status=Booking.Status.CONFIRMED)
            for booking in bookings:
                user = booking.customer
                line_users = user.line_accounts.all()
                for line_user in line_users:
                    success = send_post_trip_feedback(line_user.line_user_id, str(trip.id), trip.name, str(booking.id))
                    if success:
                        count_sent += 1
                        
        return Response({"status": "ok", "sent_count": count_sent})

    @action(detail=True, methods=['post', 'get'], url_path='task')
    def test_trip_feedback(self, request, pk=None):
        """
        Endpoint สำหรับทดสอบส่ง Feedback ของ Trip ที่ระบุไปให้ทุกคนที่จอง (ไม่ต้องรอพ้น end_date)
        """
        from .line_webhook import send_post_trip_feedback
        
        try:
            trip = self.get_object()
        except Trip.DoesNotExist:
            return Response({"error": "Trip not found"}, status=404)
            
        count_sent = 0
        bookings = Booking.objects.filter(trip=trip, status=Booking.Status.CONFIRMED)
        
        for booking in bookings:
            user = booking.customer
            line_users = user.line_accounts.all()
            for line_user in line_users:
                success = send_post_trip_feedback(line_user.line_user_id, str(trip.id), trip.name, str(booking.id))
                if success:
                    count_sent += 1
                    
        return Response({"status": "ok", "trip_id": str(trip.id), "sent_count": count_sent})


class BookingViewSet(viewsets.ModelViewSet):
    """CRUD operations for bookings"""
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = Booking.objects.select_related('trip', 'customer').all()
        
        # Filters
        status = self.request.query_params.get('status', None)
        customer_id = self.request.query_params.get('customer_id', None)
        
        if status:
            queryset = queryset.filter(status=status)
        if customer_id:
            queryset = queryset.filter(customer__id=customer_id)
            
        return queryset.order_by('-created_at')

class CustomerViewSet(viewsets.ModelViewSet):
    """CRUD operations for customers"""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = Customer.objects.select_related('user').all()
        
        # Filters
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(user__name__icontains=search) |
                Q(user__phone__icontains=search) |
                Q(id_number__icontains=search)
            )
            
        return queryset.order_by('-user__id')

class AdminViewSet(viewsets.ModelViewSet):
    """CRUD operations for admins"""
    queryset = Admin.objects.all()
    serializer_class = AdminSerializer
    pagination_class = StandardResultsSetPagination

class PaymentViewSet(viewsets.ModelViewSet):
    """CRUD operations for payments"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = Payment.objects.select_related('booking', 'verified_by').all()
        
        # Filters
        status = self.request.query_params.get('status', None)
        method = self.request.query_params.get('method', None)
        booking_id = self.request.query_params.get('booking_id', None)
        
        if status:
            queryset = queryset.filter(payment_status=status)
        if method:
            queryset = queryset.filter(payment_method=method)
        if booking_id:
            queryset = queryset.filter(booking__id=booking_id)
            
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def upload_slip(self, request, pk=None):
        """Upload payment slip"""
        payment = self.get_object()
        
        if 'slip_image' not in request.FILES:
            return Response(
                {'error': 'No slip image provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment.slip_image = request.FILES['slip_image']
        payment.payment_status = Payment.Status.SLIP_UPLOADED
        payment.slip_uploaded_at = timezone.now()
        payment.save()
        
        serializer = self.get_serializer(payment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def verify_payment(self, request, pk=None):
        """Verify payment by admin"""
        payment = self.get_object()
        
        verification_status = request.data.get('status')  # 'paid' or 'failed'
        notes = request.data.get('notes', '')
        
        if verification_status not in ['paid', 'failed']:
            return Response(
                {'error': 'Invalid status. Use "paid" or "failed"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment.payment_status = verification_status
        payment.verified_by_id = request.data.get('verified_by')  # Admin user ID
        payment.verified_at = timezone.now()
        payment.verification_notes = notes
        
        if verification_status == 'paid':
            payment.paid_at = timezone.now()
            # Update booking status
            payment.booking.status = Booking.Status.CONFIRMED
            payment.booking.save()
        
        payment.save()
        
        serializer = self.get_serializer(payment)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_verification(self, request):
        """Get payments pending verification"""
        pending_payments = Payment.objects.filter(
            payment_status=Payment.Status.SLIP_UPLOADED
        ).select_related('booking', 'booking__trip', 'booking__customer').order_by('slip_uploaded_at')
        
        serializer = self.get_serializer(pending_payments, many=True)
        return Response(serializer.data)

class EquipmentViewSet(viewsets.ModelViewSet):
    """CRUD operations for equipment"""
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Equipment.objects.all()

        # Filters
        name = self.request.query_params.get('name', None)
        price_min = self.request.query_params.get('price_min', None)
        price_max = self.request.query_params.get('price_max', None)

        if name:
            queryset = queryset.filter(name__icontains=name)
        if price_min:
            queryset = queryset.filter(price__gte=price_min)
        if price_max:
            queryset = queryset.filter(price__lte=price_max)

        return queryset.order_by('price')

    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get only available equipment (e.g., with stock or not booked yet)"""
        # Logic to filter available equipment
        available_equipment = Equipment.objects.filter(price__gte=100)  # Example: Filter equipment above a certain price
        serializer = self.get_serializer(available_equipment, many=True)
        return Response(serializer.data)
    
class BookingEquipmentViewSet(viewsets.ModelViewSet):
    """CRUD operations for booking equipment"""
    queryset = BookingEquipment.objects.all()
    serializer_class = BookingEquipmentSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = BookingEquipment.objects.all()

        # Filters
        booking_id = self.request.query_params.get('booking', None)
        equipment_name = self.request.query_params.get('equipment_name', None)
        quantity_min = self.request.query_params.get('quantity_min', None)

        if booking_id:
            queryset = queryset.filter(booking__id=booking_id)
        if equipment_name:
            queryset = queryset.filter(equipment__name__icontains=equipment_name)
        if quantity_min:
            queryset = queryset.filter(quantity__gte=quantity_min)

        return queryset.order_by('quantity')

    @action(detail=False, methods=['get'])
    def total_price(self, request):
        """Calculate total price for all booking equipment"""
        booking_id = request.query_params.get('booking_id', None)
        
        if booking_id:
            # Logic to calculate total price of all equipment for the booking
            booking_equipment = BookingEquipment.objects.filter(booking__id=booking_id)
            total_price = sum([item.total_price for item in booking_equipment])

            return Response({"total_price": total_price})

        return Response({"error": "Booking ID is required"}, status=400)

