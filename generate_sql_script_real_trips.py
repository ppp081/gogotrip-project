import uuid
import random
from datetime import datetime, timedelta

# Existing real Trip IDs
REAL_TRIP_IDS = [
    "5e478776-7aff-4369-8b6a-30fba6c0c3c5",
    "657c9a54-3a6b-4ebb-85ec-8b473c919442",
    "0051b6a0-d3b4-4669-bc50-ef8fd691e47a",
    "2f90e6a6-ee4f-4622-aeff-3b4338d33902",
    "074ca658-a456-47cc-a387-cf3106382f09",
    "08716b69-ec5f-4350-a6f5-c0bfa0880e6a",
    "276533c1-5845-4213-b971-eef2592ad79c",
    "0d4c4924-f50e-466d-b8eb-373dd9d05a2e",
    "2fc2ad5f-d06d-470c-a211-b6d45771c113",
    "310e80bb-6ee6-4476-92f5-d13097641830",
    "36f380dd-8239-4e12-858b-029d13f42dee",
    "4b7991c9-19a8-4bb4-8498-f928f642bcde",
    "4be2c09b-21bc-4edb-8836-25121a526dc2",
    "85203f3d-ee05-4211-8494-64e6af36258d",
    "819bd294-797a-42eb-af2c-4a9db64494ba",
    "adf842f0-7509-44f4-ae17-a897048e0950",
    "9785a3b8-7fe3-4f37-9c08-62a54d594266",
    "9c95fefa-de6f-4ffa-a710-c3b29d87eace",
    "ac4e0d97-3ca7-41a5-92eb-ceec67df9e70",
    "ad4d56d0-9355-41e5-9e4c-3d16c8d0ac4e",
    "adb0c50f-87c9-4236-b1af-a92a7410fbf6",
    "bb92951d-a2e0-4512-9365-fae01e9c2e77",
    "c2e15810-4545-4717-bdd0-ecaa107111a9",
    "d5b44f71-83dc-4d5e-8918-0c05fe044ed2",
    "db6e6e66-4d49-4318-a08f-089e7df0a6fa",
    "e15ec0f4-91d8-4dc2-9fb5-a6e36f324886",
    "e491c123-42ff-43ea-a4d0-47823b8c4790",
    "eda6fb32-caaa-477e-8efd-217f5ac30168",
    "f528b017-d2b8-4ba7-be43-f3b52dedc9de",
    "80e42cfc-9be5-4408-a58b-f055af004439",
    "e1387625-bf48-471b-be92-e47a69aa3f89",
    "b0c6a5ad-9438-472d-850c-ac806cd57af6",
    "070b469a-5ad2-460a-a48c-aa0e90cc1318",
    "0f5bb9c6-e1c7-408f-8357-4aa16fd3d3c9",
    "937ae761-01ac-4cca-95d6-8a7f2d6a7239",
    "a4b74f38-57dd-4509-b52e-db8c738bde53",
    "11111111-0000-0000-0000-000000000001"
]

def get_valid_uuid():
    return str(uuid.uuid4())

# We will create a fresh customer to attach bookings to
CUSTOMER_ID = get_valid_uuid()

NOW = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

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

# 1. Users (Customer only)
# We assume Trips already exist, so we skip Trip creation.
# We create a new Customer to own these bookings.
sql_statements.append(f"-- Insert Mock Customer")
sql_statements.append(f"""
INSERT INTO public.chat_user (id, name, phone, role) 
VALUES ('{CUSTOMER_ID}', 'SQL Customer (Real Trips)', '0888888888', 'customer') 
ON CONFLICT (id) DO NOTHING;
""")

sql_statements.append(f"-- Insert Bookings and Ratings for Real Trips")

# Distribute 100 ratings across the real trips
# roughly 2-3 ratings per trip
for i in range(100):
    trip_id = random.choice(REAL_TRIP_IDS)
    
    booking_id = get_valid_uuid()
    rating_id = get_valid_uuid()
    
    comment, min_r, max_r = random.choice(feedback_pool)
    score = random.randint(min_r, max_r)
    
    # Booking
    sql_statements.append(f"""
INSERT INTO public.chat_booking (
    id, trip_id, customer_id, group_size, total_price, status, created_at
) VALUES (
    '{booking_id}', '{trip_id}', '{CUSTOMER_ID}', 2, 5000.00, 'confirmed', '{NOW}'
);
""")
    
    # Rating
    sql_statements.append(f"""
INSERT INTO public.chat_rating (
    id, trip_id, booking_id, user_id, trip_rating, service_rating, comment, created_at
) VALUES (
    '{rating_id}', '{trip_id}', '{booking_id}', '{CUSTOMER_ID}', {score}, {score}, '{comment}', '{NOW}'
);
""")

# Write to file
with open('mock_ratings_real_trips.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_statements))

print("mock_ratings_real_trips.sql generated successfully using REAL Trip IDs.")
