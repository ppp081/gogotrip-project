import uuid
import random
from datetime import datetime, timedelta

# Static UUIDs to ensure relationships work
# NOTE: User decided to provide existing User IDs, so we will use one of them as a customer.
# Let's pick 'U0026300515b1e02c31648aa76b9dd67a' (Balllll) as the customer for these mocks.
# For Admin, we still need a valid user ID. 
# The user provided list seems to be from 'LineUser' or typical string IDs, but the Django User model expects UUIDs if allowed, 
# OR it might be using default integer IDs if not specified, BUT the models.py showed:
# id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
# So the User model definitely uses UUIDs.

# The IDs provided by the user (e.g. U0f9e2ad1fae9b888c556a59e9b1e33da) look like LINE User IDs, not UUIDs.
# Looking at models.py again:
# class User(models.Model):
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

# The user provided input seems to be a list of LINE users context.
# However, the 'Rating' model links to 'User'.
# And 'LineUser' links to 'User' via foreign key (nullable).

# If the user wants to link these ratings to specific real users, we need their UUIDs from the 'chat_user' table, NOT their Line IDs.
# The error `invalid input syntax for type uuid: "t0000000-0000-0000-0000-000000000001"` suggests that the UUID format used in the previous SQL script was rejected by Postgres, possibly because I used a simplified 't0...' string which is technically not a valid UUID standard format (though some systems accept it, strict UUID parsers won't).
# I must use proper UUID standard format: 8-4-4-4-12 hex digits.

# Let's generate VALID UUIDs this time.
# And since we don't know the real UUIDs of the users (the provided list clearly shows Line IDs starting with 'U...'), 
# we will create NEW Users with valid UUIDs to be safe, ensuring the script is self-contained.

def get_valid_uuid():
    return str(uuid.uuid4())

ADMIN_ID = get_valid_uuid()
CUSTOMER_ID = get_valid_uuid()
TRIP_ID = get_valid_uuid()

# Dates
NOW = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
NEXT_MONTH = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')
NEXT_MONTH_END = (datetime.now() + timedelta(days=33)).strftime('%Y-%m-%d %H:%M:%S')

# Feedback Data
feedback_pool = [
    ("ทริปนี้สุดยอดมาก! ประทับใจทุกอย่างเลยครับ", 5, 5),
    ("บริการดีเยี่ยม อาหารอร่อย วิวสวยมาก", 5, 5),
    ("ไกด์เป็นกันเอง ดูแลดีตลอดทริป แนะนำเลยครับ", 5, 5),
    ("คุ้มค่าเกินราคา สนุกมากครับ", 5, 5),
    ("The best trip ever! Highly recommended.", 5, 5),
    ("ทุกอย่างสมบูรณ์แบบ จะกลับมาอีกแน่นอน", 5, 5),
    ("ประทับใจการจัดการของทัวร์มาก สะดวกสบาย", 5, 5),
    ("สถานที่สวยงาม ถ่ายรูปสวยทุกมุม", 5, 5),
    ("รักทริปนี้มากครับ เพื่อนร่วมทริปน่ารัก ไกด์เก่ง", 5, 5),
    ("10/10 ไม่หักเลยครับ ชอบมากๆ", 5, 5),
    ("สนุกดีครับ แต่อากาศร้อนไปนิด", 4, 4),
    ("โดยรวมดีครับ อาหารน่าจะหลากหลายกว่านี้หน่อย", 4, 4),
    ("ไกด์ให้ข้อมูลดีมากครับ แต่รถแอร์ไม่ค่อยเย็น", 4, 4),
    ("Good experience, but a bit crowded.", 4, 4),
    ("วิวสวยครับ แต่เดินทางนานไปหน่อย", 4, 4),
    ("บริการดีครับ แต่ห้องน้ำตามจุดแวะพักไม่ค่อยสะอาด", 4, 4),
    ("ชอบครับ ถ้ามีกิจกรรมทางน้ำเยอะกว่านี้จะดีมาก", 4, 4),
    ("ดีครับ เหมาะสำหรับพาครอบครัวมาเที่ยว", 4, 4),
    ("ก็โอเคครับ ตามมาตรฐาน", 4, 4),
    ("ประทับใจครับ แต่เสียดายฝนตกนิดหน่อย", 4, 4),
    ("เฉยๆ ครับ ไม่ได้ว้าวมาก", 3, 3),
    ("ก็พอใช้ได้ครับ สมราคา", 3, 3),
    ("Average trip. Nothing special.", 3, 3),
    ("อาหารกลางวันน้อยไปหน่อยครับ ไม่อิ่ม", 3, 3),
    ("ไกด์พูดเร็วไปหน่อย ฟังไม่ค่อยทัน", 3, 3),
    ("โปรแกรมแน่นเกินไป เหนื่อยมาก", 3, 3),
    ("รถรับส่งมาช้ากว่ากำหนด 30 นาที", 3, 3),
    ("สถานที่สวยแต่คนเยอะมาก ถ่ายรูปไม่สะดวก", 3, 3),
    ("ห้องพักเก่ากว่าที่คิดไว้", 3, 3),
    ("พนักงานบริการช้าไปบ้าง", 3, 3),
    ("ไม่ประทับใจเลยครับ บริการแย่มาก", 1, 2),
    ("รถเสียระหว่างทาง เสียเวลามาก", 1, 2),
    ("อาหารไม่สด ท้องเสียเลยครับ", 1, 2),
    ("ไกด์ไม่ดูแลลูกทัวร์เลย หายไปไหนไม่รู้", 1, 2),
    ("Terrible experience. Do not recommend.", 1, 1),
    ("ไม่ตรงปกอย่างแรง ผิดหวังมาก", 1, 2),
    ("แพงเกินไปเมื่อเทียบกับคุณภาพที่ได้", 1, 2),
    ("สกปรกมากครับ ไม่มีการจัดการขยะเลย", 1, 2),
    ("โดนยกเลิกกิจกรรมบางอย่างโดยไม่บอกล่วงหน้า", 1, 2),
    ("แอร์ในรถเสีย ร้อนตับแลบตลอดทาง", 1, 1),
]

sql_statements = []

# 1. Users (Admin and Customer)
sql_statements.append(f"-- Insert Mock Users (Admin and Customer)")
sql_statements.append(f"""
INSERT INTO public.chat_user (id, name, phone, role) 
VALUES ('{ADMIN_ID}', 'SQL Admin', '0999999999', 'admin') 
ON CONFLICT (id) DO NOTHING;
""")
sql_statements.append(f"""
INSERT INTO public.chat_user (id, name, phone, role) 
VALUES ('{CUSTOMER_ID}', 'SQL Customer', '0888888888', 'customer') 
ON CONFLICT (id) DO NOTHING;
""")

# 2. Trip
sql_statements.append(f"-- Insert Mock Trip")
sql_statements.append(f"""
INSERT INTO public.chat_trip (
    id, name, description, content, location, category, province, country, 
    price_per_person, capacity, start_date, end_date, created_by_id, created_at
) VALUES (
    '{TRIP_ID}', 'SQL Mock Trip (Phuket)', 'Generated via SQL script', '', 'south', 'trending', 'Phuket', 'Thailand',
    2500.00, 500, '{NEXT_MONTH}', '{NEXT_MONTH_END}', '{ADMIN_ID}', '{NOW}'
) ON CONFLICT (id) DO NOTHING;
""")

# 3. Bookings and Ratings
sql_statements.append(f"-- Insert Bookings and Ratings")

for _ in range(50):
    booking_id = get_valid_uuid()
    rating_id = get_valid_uuid()
    comment, min_r, max_r = random.choice(feedback_pool)
    score = random.randint(min_r, max_r)
    
    # Booking
    sql_statements.append(f"""
INSERT INTO public.chat_booking (
    id, trip_id, customer_id, group_size, total_price, status, created_at
) VALUES (
    '{booking_id}', '{TRIP_ID}', '{CUSTOMER_ID}', 2, 5000.00, 'confirmed', '{NOW}'
);
""")
    
    # Rating
    sql_statements.append(f"""
INSERT INTO public.chat_rating (
    id, trip_id, booking_id, user_id, trip_rating, service_rating, comment, created_at
) VALUES (
    '{rating_id}', '{TRIP_ID}', '{booking_id}', '{CUSTOMER_ID}', {score}, {score}, '{comment}', '{NOW}'
);
""")

# Write to file
with open('mock_ratings_v2.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_statements))

print("mock_ratings_v2.sql generated successfully with Valid UUIDs.")
