# ✈️ GoGoTrip Project

ยินดีต้อนรับสู่โปรเจกต์ **GoGoTrip**! โปรเจกต์นี้ถูกจัดการโดยแบ่งแยกส่วนการทำงานออกเป็น 2 ส่วนหลักผ่าน Git Branches เพื่อความสะดวกในการพัฒนาและ Deploy ครับ

---

## 📂 โครงสร้าง Branches (Branch Structure)

โปรเจกต์นี้ประกอบด้วย 2 Branch หลักที่ทำงานร่วมกัน:

### 1. 🌐 `frontend` (React + TypeScript + Vite)
เป็นส่วนของ User Interface และ Dashboard สำหรับจัดการดูแลระบบ
- **Tech Stack:** React, TypeScript, Vite, TailwindCSS, Shadcn UI
- **การใช้งานหลัก:** 
  - ระบบจัดการข้อมูลทริปการท่องเที่ยว
  - Dashboard สำหรับ Admin/Employee
  - แสดงผลสรุปคะแนนความพึงพอใจ (CSAT) และรีวิวจากผู้ใช้
- **Deployment:** [Google Cloud Run (tripbot-frontend)](https://tripbot-frontend-294086862024.asia-southeast1.run.app)

### 2. ⚙️ `backend` (Django)
เป็นส่วนของ Server-side logic และระบบ AI Agent
- **Tech Stack:** Django, Python, PostgreSQL, Google Cloud SQL
- **การใช้งานหลัก:**
  - **LINE Webhook:** เชื่อมต่อกับ LINE Messaging API เพื่อตอบโต้ลูกค้า
  - **AI Agent:** ระบบ Agent อัจฉริยะที่ช่วยตอบคำถามและช่วยเหลือเรื่องการท่องเที่ยว
  - **API Service:** ให้บริการข้อมูลแก่ส่วน Frontend
- **Deployment:** [Google Cloud Run (tripbot)](https://tripbot-294086862024.asia-southeast1.run.app)

---

## 🚀 วิธีการใช้งาน (How to Use)

หากคุณต้องการสลับไปทำงานในส่วนต่างๆ สามารถใช้คำสั่ง:

### สำหรับการพัฒนา Frontend
```bash
git checkout frontend
```

### สำหรับการพัฒนา Backend
```bash
git checkout backend
```

---

## 🛠️ รายละเอียดเพิ่มเติม
ภายในแต่ละ Branch จะมีไฟล์ `README.md` เฉพาะตัว เพื่ออธิบายวิธีการ Setup และ Run ระบบในส่วนนั้นๆ อย่างละเอียดครับ

- **Frontend Guide:** ดูใน branch `frontend` ไฟล์ `README.md`
- **Backend Guide:** ดูใน branch `backend` ไฟล์ `README.md`
