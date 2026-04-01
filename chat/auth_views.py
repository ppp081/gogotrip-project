"""
Session-based admin auth for dashboard (django.contrib.auth.models.User, is_staff=True).
"""
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from chat.models import User as DomainUser
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response


def _domain_user_payload(auth_user: User) -> dict | None:
    try:
        du = auth_user.chat_profile
    except DomainUser.DoesNotExist:
        return None
    return {
        "id": str(du.id),
        "name": du.name,
        "role": du.role,
    }


def _resolve_username(identifier: str) -> str:
    identifier = (identifier or "").strip()
    if not identifier:
        return ""
    if "@" in identifier:
        u = User.objects.filter(email__iexact=identifier).first()
        if u:
            return u.username
    return identifier


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def api_login(request):
    raw = request.data.get("username") or request.data.get("email")
    password = request.data.get("password")
    username = _resolve_username(str(raw or ""))
    if not username or not password:
        return Response(
            {"detail": "กรุณากรอกชื่อผู้ใช้หรืออีเมล และรหัสผ่าน"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response(
            {"detail": "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not user.is_staff:
        return Response(
            {"detail": "บัญชีนี้ไม่มีสิทธิ์เข้าแดชบอร์ดผู้ดูแลระบบ"},
            status=status.HTTP_403_FORBIDDEN,
        )
    login(request, user)
    payload = {
        "id": user.id,
        "username": user.username,
        "email": user.email or "",
        "is_staff": user.is_staff,
    }
    chat = _domain_user_payload(user)
    if chat:
        payload["chat_user"] = chat
    return Response({"user": payload})


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def api_logout(request):
    logout(request)
    return Response({"detail": "ok"})


@api_view(["GET"])
@permission_classes([AllowAny])
def api_me(request):
    u = request.user
    if not u.is_authenticated:
        return Response({"authenticated": False})
    payload = {
        "id": u.id,
        "username": u.username,
        "email": u.email or "",
        "is_staff": u.is_staff,
    }
    chat = _domain_user_payload(u)
    if chat:
        payload["chat_user"] = chat
    return Response({"authenticated": True, "user": payload})


@api_view(["GET"])
@permission_classes([AllowAny])
def api_csrf(request):
    return Response({"csrfToken": get_token(request)})
