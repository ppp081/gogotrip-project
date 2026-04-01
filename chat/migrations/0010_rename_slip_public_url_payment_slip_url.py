from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0009_rename_bookingnotification_to_notification"),
    ]

    operations = [
        migrations.RenameField(
            model_name="payment",
            old_name="slip_public_url",
            new_name="payment_slip_url",
        ),
    ]
