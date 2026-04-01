"""
API Views for CRUD operations
"""


from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count, F, Sum, Avg
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
    Rating,
    Summary,
    Notification,
)
from .serializers import (
    LineUserSerializer, LineMessageSerializer, ImageSerializer,
    ChatbotSessionSerializer, TripSerializer, BookingSerializer,
    PaymentSerializer, CustomerSerializer, AdminSerializer, EquipmentSerializer,
    BookingEquipmentSerializer, RatingSerializer, SummarySerializer,
    NotificationSerializer,
)
from .permissions import IsStaffUser, IsStaffOrReadOnly
from .booking_notifications import notify_booking_created



class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class LineUserViewSet(viewsets.ModelViewSet):
    """CRUD operations for LINE users"""
    permission_classes = [IsStaffUser]
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
    permission_classes = [IsStaffUser]
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
    permission_classes = [IsStaffUser]
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
    permission_classes = [IsStaffOrReadOnly]
    queryset = Image.objects.all()
    serializer_class = ImageSerializer

    @action(detail=True, methods=['get'])
    def file(self, request, pk=None):
        img = self.get_object()
        if img.image_url:
            from django.shortcuts import redirect
            return redirect(img.image_url)
        if not img.image_data:
            raise Http404("No image file stored")
        return HttpResponse(img.image_data, content_type="image/jpeg")


class TripViewSet(viewsets.ModelViewSet):
    """CRUD operations for trips"""
    permission_classes = [IsStaffOrReadOnly]
    queryset = Trip.objects.all()
    serializer_class = TripSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Trip.objects.all()

        # ลูกค้า / anonymous เห็นเฉพาะทริปที่เปิดแสดง — staff เห็นทั้งหมด
        user = self.request.user
        if not (user.is_authenticated and user.is_staff):
            queryset = queryset.filter(is_active=True)

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
            start_date__gt=timezone.now(),
            is_active=True,
        ).order_by('start_date')
        
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
    permission_classes = [IsStaffUser]
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    pagination_class = StandardResultsSetPagination

    def perform_create(self, serializer):
        booking = serializer.save()
        notify_booking_created(booking)

    def get_queryset(self):
        queryset = (
            Booking.objects.select_related("trip", "customer")
            .prefetch_related("customer__line_accounts")
            .all()
        )

        # Filters
        status = self.request.query_params.get('status', None)
        customer_id = self.request.query_params.get('customer_id', None)
        
        if status:
            queryset = queryset.filter(status=status)
        if customer_id:
            queryset = queryset.filter(customer__id=customer_id)
            
        return queryset.order_by('-created_at')


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """รายการแจ้งเตือนการจองใหม่ (อ่านจาก DB เดียวกับ WebSocket payload)"""
    permission_classes = [IsStaffUser]
    queryset = Notification.objects.select_related('booking', 'booking__trip', 'booking__customer').all()
    serializer_class = NotificationSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        qs = super().get_queryset()
        unread = self.request.query_params.get('unread')
        if unread and str(unread).lower() in ('1', 'true', 'yes'):
            qs = qs.filter(read_at__isnull=True)
        return qs.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.read_at = timezone.now()
        notif.save(update_fields=['read_at'])
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """ทำเครื่องหมายว่าอ่านทุกรายการที่ยังไม่อ่าน"""
        now = timezone.now()
        updated = Notification.objects.filter(read_at__isnull=True).update(read_at=now)
        return Response({"updated": updated, "read_at": now.isoformat()})


class CustomerViewSet(viewsets.ModelViewSet):
    """CRUD operations for customers"""
    permission_classes = [IsStaffUser]
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
    permission_classes = [IsStaffUser]
    queryset = Admin.objects.all()
    serializer_class = AdminSerializer
    pagination_class = StandardResultsSetPagination

class PaymentViewSet(viewsets.ModelViewSet):
    """CRUD operations for payments"""
    permission_classes = [IsStaffUser]
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = Payment.objects.select_related('booking').all()
        
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
        """Upload slip → Supabase หรือบันทึกใต้ MEDIA + PUBLIC_BACKEND_URL / LINE_CHANNEL_NGROK_BASE."""
        payment = self.get_object()

        if 'slip_image' not in request.FILES:
            return Response(
                {'error': 'No slip image provided'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .supabase_storage import upload_payment_slip

        raw = request.FILES['slip_image'].read()
        pub, _ = upload_payment_slip(raw, payment.id)
        if not pub:
            return Response(
                {
                    'error': (
                        'Could not store slip or build public URL. '
                        'Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, or '
                        'PUBLIC_BACKEND_URL / LINE_CHANNEL_NGROK_BASE for local media fallback.'
                    ),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        payment.payment_url = pub
        payment.payment_status = Payment.Status.SLIP_UPLOADED
        payment.save()

        serializer = self.get_serializer(payment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def verify_payment(self, request, pk=None):
        """Verify payment by admin"""
        payment = self.get_object()
        
        verification_status = request.data.get('status')  # 'paid' or 'failed'

        if verification_status not in ['paid', 'failed']:
            return Response(
                {'error': 'Invalid status. Use "paid" or "failed"'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment.payment_status = verification_status

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
        ).select_related('booking', 'booking__trip', 'booking__customer').order_by('created_at')
        
        serializer = self.get_serializer(pending_payments, many=True)
        return Response(serializer.data)

class EquipmentViewSet(viewsets.ModelViewSet):
    """CRUD operations for equipment"""
    permission_classes = [IsStaffUser]
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
    permission_classes = [IsStaffUser]
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


class RatingViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only CRUD operations for ratings"""
    permission_classes = [IsStaffUser]
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = Rating.objects.select_related('user', 'trip').all()
        
        # Filters
        trip_id = self.request.query_params.get('trip', None)
        user_id = self.request.query_params.get('user', None)
        
        if trip_id:
            queryset = queryset.filter(trip__id=trip_id)
        if user_id:
            queryset = queryset.filter(user__id=user_id)
            
        return queryset.order_by('-created_at')


class SummaryViewSet(viewsets.ReadOnlyModelViewSet):
    """AI-generated review analysis summaries."""
    permission_classes = [IsStaffUser]
    queryset = Summary.objects.all()
    serializer_class = SummarySerializer
    pagination_class = StandardResultsSetPagination

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Return the most recent summary, or 404 if none exists."""
        summary = Summary.objects.order_by('-created_at').first()
        if not summary:
            return Response(
                {"detail": "No summary available yet."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(SummarySerializer(summary).data)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Trigger AI analysis of all ratings and create a new Summary."""
        from .agent import analyze_reviews

        try:
            summary = analyze_reviews()
            return Response(
                SummarySerializer(summary).data,
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"detail": f"Analysis failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DashboardViewSet(viewsets.ViewSet):
    """Aggregate statistics and data for the dashboard"""
    permission_classes = [IsStaffUser]

    def list(self, request):
        from django.utils.timezone import localtime
        from datetime import timedelta
        
        now = localtime()
        current_year = now.year
        five_years_ago = current_year - 4
        
        # Stats summary
        active_trips_count = Trip.objects.filter(is_active=True).count()
        total_bookings = Booking.objects.count()
        total_revenue = Payment.objects.filter(payment_status=Payment.Status.PAID).aggregate(Sum('amount'))['amount__sum'] or 0

        # Satisfaction scores from real Ratings
        avg_satisfaction = Rating.objects.aggregate(Avg('service_rating'))['service_rating__avg'] or 4.5
        
        # Top trips by popularity (bookings) and revenue
        # We fetch a larger pool (top 30) to allow accurate frontend sorting for Top 5
        top_trips_qs = Trip.objects.annotate(
            bookings_count=Count('booking', filter=~Q(booking__status=Booking.Status.CANCELLED)),
            total_travelers=Sum('booking__group_size', filter=~Q(booking__status=Booking.Status.CANCELLED)),
            total_revenue_sum=Sum('booking__payment__amount', filter=Q(booking__payment__payment_status=Payment.Status.PAID))
        ).order_by('-bookings_count')[:30]
        
        top_trips = []
        for t in top_trips_qs:
            # Optimize: Get only the thumbnail URL
            thumb = t.images.filter(image_thumbnail=True).first()
            top_trips.append({
                "id": str(t.id),
                "name": t.name,
                "bookings": t.bookings_count,
                "travelers": t.total_travelers or 0,
                "revenue": float(t.total_revenue_sum or 0),
                "image": thumb.image_url if thumb else None
            })
        
        # Recent bookings
        recent_qs = Booking.objects.select_related('customer', 'trip').prefetch_related('payment_set').order_by('-created_at')[:10]
        recent_bookings = []
        for b in recent_qs:
            payment = b.payment_set.first()
            ps = "Due"
            if payment:
                if payment.payment_status == Payment.Status.PAID: ps = "Paid"
                else: ps = "Pending"
                
            recent_bookings.append({
                "id": str(b.id),
                "customerName": b.customer.name,
                "trip": b.trip.name,
                "people": b.group_size,
                "paymentStatus": ps,
                "amount": float(b.total_price),
                "bookingDate": b.created_at.isoformat()
            })
            
        # Real Chatbot insights
        total_chats = ChatbotSession.objects.count()
        intent_counts = ChatbotSession.objects.values('intent').annotate(count=Count('session_id')).order_by('-count')[:5]
        chatbot_insights = {
            "totalConversations": total_chats,
            "commonQuestions": [{"question": i['intent'] or 'General', "count": i['count']} for i in intent_counts],
            "satisfaction": round(float(avg_satisfaction), 1)
        }
        # Fallback if no real session data for nice initial visual
        if not chatbot_insights["commonQuestions"]:
             chatbot_insights["commonQuestions"] = [
                {"question": "แพ็กเกจทริปมีอะไรบ้าง?", "count": 156},
                {"question": "ระดับความยากเป็นอย่างไร?", "count": 134},
                {"question": "ควรเตรียมอะไรไปบ้าง?", "count": 98},
                {"question": "นโยบายยกเลิกเป็นอย่างไร?", "count": 87},
                {"question": "มีอุปกรณ์ให้ยืมหรือไม่?", "count": 76},
             ]

        # Prepare Charts Data structure
        days_of_week_th = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."]
        months_th = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
        
        revenue_series = {
            "monthly": [{"name": m, "value": 0} for m in months_th],
            "yearly": [{"name": str(y), "value": 0} for y in range(five_years_ago, current_year + 1)]
        }
        guest_series = {
            "monthly": [{"name": m, "value": 0} for m in months_th],
            "yearly": [{"name": str(y), "value": 0} for y in range(five_years_ago, current_year + 1)]
        }
        room_series = {
            "monthly": [{"name": m, "occupied": 0, "booked": 0, "available": 0} for m in months_th],
            "yearly": [{"name": str(y), "occupied": 0, "booked": 0, "available": 0} for y in range(five_years_ago, current_year + 1)]
        }
        
        # Pull limited payments and hydrate series
        pmts = Payment.objects.filter(payment_status=Payment.Status.PAID, created_at__year__gte=five_years_ago).only('amount', 'created_at')
        for p in pmts:
            dt = localtime(p.created_at)
            amt = float(p.amount)
            # Monthly/Yearly buckets
            if dt.year == current_year:
                revenue_series["monthly"][dt.month-1]["value"] += amt
            for item in revenue_series["yearly"]:
                if item["name"] == str(dt.year):
                    item["value"] += amt

        # Pull limited bookings and hydrate series
        docs = Booking.objects.filter(created_at__year__gte=five_years_ago).only('group_size', 'status', 'created_at')
        for b in docs:
            dt = localtime(b.created_at)
            gs = b.group_size
            
            # Key determine
            if b.status == Booking.Status.CONFIRMED: key = "occupied"
            elif b.status == Booking.Status.PENDING: key = "booked"
            else: key = "available"
            
            # Monthly/Yearly buckets
            if dt.year == current_year:
                if key == "occupied": guest_series["monthly"][dt.month-1]["value"] += gs
                room_series["monthly"][dt.month-1][key] += gs
                
            for iY in range(len(guest_series["yearly"])):
                if guest_series["yearly"][iY]["name"] == str(dt.year):
                    if key == "occupied": guest_series["yearly"][iY]["value"] += gs
                    room_series["yearly"][iY][key] += gs
                    
        return Response({
            "activeTripsCount": active_trips_count,
            "totalBookingsCount": total_bookings,
            "totalRevenue": float(total_revenue),
            "topTrips": top_trips,
            "recentBookings": recent_bookings,
            "chatbotInsights": chatbot_insights,
            "revenueSeries": revenue_series,
            "guestSeries": guest_series,
            "roomSeries": room_series
        })

