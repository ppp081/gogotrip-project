from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0008_bookingnotification"),
    ]

    operations = [
        migrations.RenameModel(
            old_name="BookingNotification",
            new_name="Notification",
        ),
    ]
