"""
Management command to test LINE webhook functionality
"""
from django.core.management.base import BaseCommand
from chat.models import LineUser, LineMessage
from django.utils import timezone
import json

class Command(BaseCommand):
    help = 'Test LINE webhook functionality'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--create-test-data',
            action='store_true',
            help='Create test LINE user and messages',
        )
        
    def handle(self, *args, **options):
        if options['create_test_data']:
            self.create_test_data()
        else:
            self.show_stats()
    
    def create_test_data(self):
        """Create test LINE user and messages"""
        self.stdout.write("Creating test LINE data...")
        
        # Create test user
        test_user, created = LineUser.objects.get_or_create(
            line_user_id='test_user_123',
            defaults={
                'display_name': 'Test User',
                'language': 'th'
            }
        )
        
        if created:
            self.stdout.write(f"Created test user: {test_user.display_name}")
        else:
            self.stdout.write(f"Test user already exists: {test_user.display_name}")
        
        # Create test messages
        test_messages = [
            {
                'content': 'สวัสดีครับ',
                'direction': LineMessage.Direction.INCOMING,
                'ai_response': 'สวัสดีครับ! ยินดีต้อนรับสู่ GoGo Trip มีอะไรให้ช่วยเหลือเกี่ยวกับการท่องเที่ยวไหมครับ?'
            },
            {
                'content': 'อยากไปเที่ยวภาคเหนือ',
                'direction': LineMessage.Direction.INCOMING,
                'ai_response': 'ภาคเหนือมีสถานที่ท่องเที่ยวสวยๆ มากมายครับ เช่น เชียงใหม่ เชียงราย แม่ฮ่องสอน คุณสนใจไปช่วงไหนครับ?'
            }
        ]
        
        for i, msg_data in enumerate(test_messages):
            # Incoming message
            incoming_msg, created = LineMessage.objects.get_or_create(
                line_user=test_user,
                message_id=f'test_msg_{i}_incoming',
                defaults={
                    'message_type': LineMessage.MessageType.TEXT,
                    'direction': msg_data['direction'],
                    'content': msg_data['content'],
                    'timestamp': timezone.now(),
                    'ai_response': msg_data['ai_response'],
                    'processed': True
                }
            )
            
            # Outgoing response
            outgoing_msg, created = LineMessage.objects.get_or_create(
                line_user=test_user,
                message_id=f'test_msg_{i}_outgoing',
                defaults={
                    'message_type': LineMessage.MessageType.TEXT,
                    'direction': LineMessage.Direction.OUTGOING,
                    'content': msg_data['ai_response'],
                    'timestamp': timezone.now(),
                    'processed': True
                }
            )
        
        self.stdout.write(self.style.SUCCESS("Test data created successfully!"))
    
    def show_stats(self):
        """Show LINE webhook statistics"""
        self.stdout.write("LINE Webhook Statistics:")
        self.stdout.write("-" * 40)
        
        total_users = LineUser.objects.count()
        total_messages = LineMessage.objects.count()
        incoming_messages = LineMessage.objects.filter(
            direction=LineMessage.Direction.INCOMING
        ).count()
        outgoing_messages = LineMessage.objects.filter(
            direction=LineMessage.Direction.OUTGOING
        ).count()
        processed_messages = LineMessage.objects.filter(processed=True).count()
        
        self.stdout.write(f"Total LINE Users: {total_users}")
        self.stdout.write(f"Total Messages: {total_messages}")
        self.stdout.write(f"Incoming Messages: {incoming_messages}")
        self.stdout.write(f"Outgoing Messages: {outgoing_messages}")
        self.stdout.write(f"Processed Messages: {processed_messages}")
        
        # Recent users
        recent_users = LineUser.objects.order_by('-created_at')[:5]
        if recent_users:
            self.stdout.write("\nRecent Users:")
            for user in recent_users:
                msg_count = user.linemessage_set.count()
                self.stdout.write(f"  - {user.display_name} ({msg_count} messages)")