"""
DRF session auth โดยไม่ enforce CSRF — กัน 403 จาก SPA ข้ามโดเมน (คนละ origin กับ API).

ความเสี่ยง: ถ้า user ล็อกอิน session อยู่ เว็บไซต์อื่นอาจยิง POST มาที่ API ของคุณได้ (CSRF).
ลดความเสี่ยงด้วย: CORS จำกัด origin, SameSite cookie, ไม่เปิด CORS *,
ใช้ HTTPS, พิจารณาเปลี่ยนเป็น Token/JWT ในอนาคต.
"""

from rest_framework.authentication import SessionAuthentication


class SessionAuthenticationWithoutCSRF(SessionAuthentication):
    def enforce_csrf(self, request):
        return
