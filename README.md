gcloud builds submit \
  --tag gcr.io/gogotrip-senior-project/tripbot


gcloud run services update tripbot \
  --region asia-southeast1 \
  --update-env-vars \
FRONTEND_URL="http://localhost:5173,https://tripbot-frontend-294086862024.asia-southeast1.run.app"





โอเค จัดให้แบบ **สั้นมาก ใช้บน macOS เท่านั้น** 👇

---


# App Backend (Django) – macOS

## 1. สร้างและ activate virtual environment

python3 -m venv venv
source venv/bin/activate

## 2. ติดตั้ง dependencies


pip install -r requirements.txt

## 3. migrate database


python manage.py migrate

## 4. run server


python manage.py runserver
ngrok http 8000
https://cc56-2403-6200-88a7-1016-7098-35d9-1307-601d.ngrok-free.app