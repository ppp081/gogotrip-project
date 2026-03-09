gcloud builds submit \
  --tag gcr.io/gogotrip-senior-project/tripbot


gcloud run services update tripbot \
  --region asia-southeast1 \
  --update-env-vars \
FRONTEND_URL="http://localhost:5173,https://tripbot-frontend-294086862024.asia-southeast1.run.app"


1. Backend (app-backend)
The backend is a Django application.

Navigate to the backend directory:

bash
cd /Users/punch/project/app-frontend/final/app-backend
Create and activate a virtual environment (Recommended):

bash
python3 -m venv venv
source venv/bin/activate 
Install dependencies:

bash
pip install -r requirements.txt
Run database migrations:

bash
python manage.py migrate
Start the server:

bash
python manage.py runserver
The backend will run at http://127.0.0.1:8000.