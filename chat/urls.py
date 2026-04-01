"""
Chat app URLs for API endpoints
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .auth_views import api_login, api_logout, api_me, api_csrf
from .api_views import (
    LineUserViewSet,
    LineMessageViewSet,
    ChatbotSessionViewSet,
    TripViewSet,
    BookingViewSet,
    CustomerViewSet,
    AdminViewSet,
    PaymentViewSet,
    EquipmentViewSet,
    BookingEquipmentViewSet,
    ImageViewSet,
    RatingViewSet,
    SummaryViewSet,
    NotificationViewSet,
    DashboardViewSet,
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'line-users', LineUserViewSet)
router.register(r'line-messages', LineMessageViewSet)
router.register(r'chatbot-sessions', ChatbotSessionViewSet)
router.register(r'trips', TripViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'admins', AdminViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'equipments', EquipmentViewSet)
router.register(r'booking-equipments', BookingEquipmentViewSet)
router.register(r'images', ImageViewSet)
router.register(r'ratings', RatingViewSet)
router.register(r'summaries', SummaryViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('auth/login/', api_login),
    path('auth/logout/', api_logout),
    path('auth/me/', api_me),
    path('auth/csrf/', api_csrf),
    path('', include(router.urls)),
]
