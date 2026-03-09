# App Backend (Django) – ENV macOS 

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