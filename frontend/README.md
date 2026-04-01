# Employee dashboard — booking notifications

ประวัติแจ้งเตือนโหลดจาก **API จริง** (`GET /api/notifications/`) — ไม่มี mock  
Realtime: WebSocket + refetch รายการหลังมี event

## Environment (Vite)

คัดลอก `frontend/.env.example` → `.env` แล้วแก้ถ้าจำเป็น

```env
# ลงท้ายด้วย /api เสมอ
VITE_BACKEND_API=http://127.0.0.1:8000/api

# ต้องตรงกับ ADMIN_WS_TOKEN ใน Django (.env backend)
VITE_WS_TOKEN=dev-ws-token-change-me
```

- **REST** ใช้ `VITE_BACKEND_API` ต่อกับ `notifications/...`
- **WebSocket** ตัด `/api` ออก → `ws://127.0.0.1:8000/ws/admin/notifications/?token=...`

ล็อกอิน staff ก่อน (session cookie) แล้วค่อยเปิดหน้า employee — มิฉะนั้น API จะ 403

## Backend

```bash
pip install daphne channels channels-redis
python manage.py runserver
```

REST: `GET /api/notifications/?page_size=50` (ประวัติทั้งหมด), `POST /api/notifications/<id>/mark_read/`

## ใช้ในแอป React

```tsx
import { EmployeeLayout } from "./employee_layout";

export function EmployeeApp() {
  return (
    <EmployeeLayout showNotificationBell>
      {/* หน้า employee */}
    </EmployeeLayout>
  );
}
```

หน้าอื่นที่ไม่ใช่ employee ให้ไม่ใช้ `EmployeeLayout` หรือส่ง `showNotificationBell={false}`
