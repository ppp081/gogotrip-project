from rest_framework import permissions


class IsStaffUser(permissions.BasePermission):
    """Staff (admin dashboard) only — ใช้กับ API ที่ไม่ต้องเปิด public"""

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.is_staff)


class IsStaffOrReadOnly(permissions.BasePermission):
    """
    GET/HEAD/OPTIONS เปิด public (ทริป/รูปบนเว็บลูกค้า)
    POST/PUT/PATCH/DELETE ต้อง login เป็น staff
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        u = request.user
        return bool(u and u.is_authenticated and u.is_staff)
