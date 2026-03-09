"""
Chat app URLs for API endpoints
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
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


urlpatterns = [
    path('', include(router.urls)),
]
