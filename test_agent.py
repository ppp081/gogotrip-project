import os
import django

import dotenv
dotenv.load_dotenv()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tripbot.settings')
django.setup()

from chat.agent import admin_agent
from chat.models import LineUser

# Find a user to test with
user = LineUser.objects.first()
if not user:
    print("No LineUser found")
else:
    print(f"Testing with user: {user.display_name}")
    try:
        result = admin_agent("ทริปของฉันมีอะไรบ้าง", history=[], line_user=user)
        print("Result:", result)
    except Exception as e:
        print("Error:", e)
