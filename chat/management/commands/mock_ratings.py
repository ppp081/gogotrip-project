import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from chat.models import Trip, Booking, Rating, User

class Command(BaseCommand):
    help = 'Mock 50+ mixed ratings linked to trips and bookings'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting to mock 50 mixed ratings...")

        # 1. Ensure Users exist
        customer_name = "Mock Customer"
        user, _ = User.objects.get_or_create(
            name=customer_name,
            defaults={'phone': '0812345678', 'role': User.Role.CUSTOMER}
        )

        admin_name = "Mock Admin"
        admin_user, _ = User.objects.get_or_create(
            name=admin_name,
            defaults={'phone': '0899999999', 'role': User.Role.ADMIN}
        )

        # 2. Ensure Trip exists
        trip_name = "Mock Luxury Island Trip"
        trip, _ = Trip.objects.get_or_create(
            name=trip_name,
            defaults={
                'description': 'An amazing journey to the islands linked with mock ratings.',
                'province': 'Phuket',
                'price_per_person': 15000.00,
                'capacity': 100, # Increased capacity for more bookings
                'start_date': timezone.now(),
                'end_date': timezone.now() + timezone.timedelta(days=3),
                'created_by': admin_user,
                'location': Trip.Location.SOUTH,
                'category': Trip.Category.TRENDING
            }
        )

        # Define comments with associated weight/rating-range
        # Format: (Comment Text, Min Rating, Max Rating)
        feedback_pool = [
            # Excellent (5 stars)
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

            # Good (4 stars)
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

            # Average/Mixed (3 stars)
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

            # Poor/Bad (1-2 stars)
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

        # Generate 50 mock entries
        for i in range(50):
            # Allow multiple bookings for the same user or created new dummy users if needed?
            # For simplicity, we stick to the single customer but create distinct bookings.
            
            # Pick a random feedback item
            comment_text, min_r, max_r = random.choice(feedback_pool)
            
            rating_score = random.randint(min_r, max_r)
            
            # Create Booking
            group_size = random.randint(1, 6)
            booking = Booking.objects.create(
                trip=trip,
                customer=user,
                group_size=group_size,
                total_price=trip.price_per_person * group_size,
                status=Booking.Status.CONFIRMED
            )
            
            # Create Rating
            rating = Rating.objects.create(
                trip=trip,
                booking_id=booking.id,
                user=user,
                trip_rating=rating_score,
                service_rating=rating_score, # Simplify to be same as trip rating or close
                comment=comment_text,
            )
            
            self.stdout.write(f"[{i+1}/50] Created Rating: {rating_score}/5 - {comment_text[:30]}...")

        self.stdout.write(self.style.SUCCESS("Successfully mocked 50 mixed ratings!"))
