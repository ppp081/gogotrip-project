# App Backend (Django) – local + Google Cloud Run

## Local (macOS)

### 1. Virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment variables

Do **not** commit a real `.env`. Use the template and fill in your own values:

```bash
cp .env.example .env
```

Each line in `.env.example` uses **`KEY="คำอธิบาย"`** (Thai descriptions, not real secrets) — replace the entire quoted value with your real credential.  
Variables are read from `tripbot/settings.py` and `chat/agent.py` (AI keys).

### 4. Database

```bash
python manage.py migrate
```

### 5. Run server

```bash
python manage.py runserver
# Webhook จากภายนอก (LINE):
ngrok http 8000
```

---

## Deploy backend ขึ้น Google Cloud Run

โปรเจกต์ของคุณมี **Dockerfile** อยู่แล้ว (Daphne + port ตาม `PORT` ของ Cloud Run)

### สิ่งที่ต้องมีก่อน

1. ติดตั้ง [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud`)
2. Login และเลือกโปรเจกต์ (เช่น `gogotrip-senior-project`):

   ```bash
   gcloud auth login
   gcloud config set project gogotrip-senior-project
   ```

3. เปิด API: **Cloud Run**, **Artifact Registry** หรือ **Container Registry** (ตามที่ใช้ build)

### Build image และ push

รันจาก **โฟลเดอร์ที่มี `Dockerfile`** (โฟลเดอร์ backend นี้):

```bash
cd /path/to/app-backend

gcloud builds submit --tag gcr.io/gogotrip-senior-project/tripbot-backend
```

(เปลี่ยนชื่อ image ให้ตรงนโยบายทีมคุณได้ — ตัวอย่างนี้ใช้ `tripbot-backend` แยกจาก frontend)

### Deploy เป็น Cloud Run service

ใช้ชื่อ service เดียวกับ image: **`tripbot-backend`**  
แบ็กเอนด์ listen ตาม **`PORT`** (Dockerfile ใช้ Daphne กับ `${PORT:-8080}`):

```bash
gcloud run deploy tripbot-backend \
  --image gcr.io/gogotrip-senior-project/tripbot-backend \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 8080
```

**Ingress:** รับ traffic จากอินเทอร์เน็ต (เช่น **All**) ถ้า LINE / frontend เรียกจากภายนอก

**URL จริง:** ดูใน Cloud Run หลัง deploy — รูปแบบมักเป็น  
`https://tripbot-backend-<hash>.asia-southeast1.run.app` (แต่ละโปรเจกต์ไม่เหมือนกัน)

### Environment variables (ตั้งใน Cloud Run)

อย่า commit `.env` หรือไฟล์ที่มีคีย์จ — ใส่ค่าใน **Cloud Run → Edit & deploy new revision → Variables & secrets** หรือใช้ไฟล์ env ที่ไม่เข้า git

รายการตัวแปรและคำอธิบายแบบ placeholder อยู่ที่ **`.env.example`** (ค่าเป็น `"description"` ต้องแทนที่ทั้งหมดก่อน deploy)

สรุปสำคัญ:

| ตัวแปร | หมายเหตุ |
|--------|----------|
| `DJANGO_SECRET_KEY` | Secret ยาว ๆ (ไม่ใช่ค่า build ใน Dockerfile) |
| `DEBUG` | production ใส่ `False` |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | ดูหัวข้อ **Supabase Postgres** ด้านล่าง |
| `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET` | LINE |
| `LINE_CHANNEL_NGROK_BASE` หรือ **`PUBLIC_BACKEND_URL`** | ใส่ **URL ของ Cloud Run backend** เพื่อให้ลิงก์สาธารณะ (สลิป `/media` fallback) ตรงกับโดเมนจริง |
| `FRONTEND_URL` | URL frontend Cloud Run (ใช้ CORS / redirect) |
| `CORS_ALLOWED_ORIGINS` | รวม URL frontend เช่น `https://tripbot-frontend-....run.app` |
| `OPENAI_API_KEY`, `OPENROUTER_*`, อื่น ๆ | ดู `.env.example` — ใช้กับแชทบอทและสรุปรีวิว |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_OBJECT_STORAGE` | **Storage API** อัปโหลดสลิป (คนละชุดกับ `DB_*` ของ Postgres แต่โปรเจกต์เดียวกันใน Supabase) |
| `SLIPOK_*` ฯลฯ | ตาม `.env.example` |
| `ADMIN_WS_TOKEN` | โทเค็นสำหรับ WebSocket แดชบอร์ด |
| `REDIS_URL` | (ถ้าใช้ WebSocket หลาย instance ควรใช้ Redis; ไม่มีจะ fallback เป็น in-memory) |

อัปเดต **LINE Developers → Webhook URL** เป็น:

`https://<cloud-run-backend-host>/webhook/line/`

### ฐานข้อมูล: Supabase Postgres เท่านั้น

โปรเจกต์นี้ **ใช้ Supabase เป็น Postgres หลักเสมอ** (Cloud Run รันแอป; ข้อมูลอยู่ที่ Supabase)

1. **Cloud Run:** ต่อ **Supabase Postgres** ผ่านอินเทอร์เน็ต — ใช้ host/port จาก Supabase (**Settings → Database**).
2. ตั้ง env ให้ตรงกับ `tripbot/settings.py` → `DATABASES`:

   | ตัวแปร | ตัวอย่าง / หมายเหตุ |
   |--------|---------------------|
   | `DB_HOST` | เช่น `aws-0-ap-northeast-1.pooler.supabase.com` (pooler) หรือ `db.<ref>.supabase.co` (direct) |
   | `DB_PORT` | Pooler มัก `6543` (Transaction mode) หรือ `5432` ตามที่ Supabase บอก |
   | `DB_NAME` | มัก `postgres` |
   | `DB_USER` | user ที่ Supabase แสดง |
   | `DB_PASSWORD` | รหัส database — ใส่ผ่าน **Secret Manager** บน Cloud Run |

   `settings.py` ตั้ง **`sslmode: require`** เมื่อมี `DB_HOST` (กรณี Supabase)

3. **Storage สลิป:** คนละชุดกับ Postgres — ต้องมี `SUPABASE_URL` (โปรเจกต์ `https://xxxxx.supabase.co`) + `SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_OBJECT_STORAGE` (เช่น `app-object-storage`) ตามที่ใช้อยู่

### Migrations บน production DB

หลัง deploy ครั้งแรกหรือหลัง merge migration:

- วิธีที่ง่ายที่สุด: เครื่อง local ที่มี `.env` ชี้ DB เดียวกับ production แล้วรัน  
  `python manage.py migrate`
- หรือใช้ Cloud Shell / Job รัน container เดียวกัน + คำสั่ง `python manage.py migrate` (ให้ env DB เหมือน service)

### เทียบกับ frontend ที่ deploy แล้ว

Frontend ใช้ `--port 80`; backend ใช้ **8080** เพราะ image นี้รัน Daphne บน `PORT` ตามมาตรฐาน Cloud Run

```text
Frontend: gcloud run deploy tripbot-frontend ... --port 80
Backend:  gcloud run deploy tripbot-backend  ... --port 8080
```

API ฝั่ง React ตั้ง **base URL** ไปที่ backend Cloud Run (เช่น `https://tripbot-....run.app/api/`).

### ตัวอย่างคำสั่ง (แทนชื่อโปรเจกต์ / region ให้ตรงทีม)

Build และ deploy พร้อมตัวแปรจากไฟล์ (สร้างไฟล์ env ของจริงในเครื่อง — **ห้าม commit** ถ้ามี secret):

```bash
gcloud builds submit --project YOUR_GCP_PROJECT --tag gcr.io/YOUR_GCP_PROJECT/tripbot-backend .

gcloud run deploy tripbot-backend \
  --project YOUR_GCP_PROJECT \
  --image gcr.io/YOUR_GCP_PROJECT/tripbot-backend \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --env-vars-file your-cloudrun-secrets.yaml
```

ตั้ง **Webhook URL** ใน LINE Developers เป็น:

`https://<cloud-run-backend-host>/webhook/line/`