from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("chat", "0004_payment_slip_supabase"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="auth_user",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="chat_profile",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
