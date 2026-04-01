from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0010_rename_slip_public_url_payment_slip_url"),
    ]

    operations = [
        migrations.RenameField(
            model_name="payment",
            old_name="payment_slip_url",
            new_name="payment_url",
        ),
        migrations.RemoveField(
            model_name="payment",
            name="slip_storage_path",
        ),
        migrations.RemoveField(
            model_name="payment",
            name="slip_image",
        ),
        migrations.RemoveField(
            model_name="payment",
            name="slip_uploaded_at",
        ),
        migrations.RemoveField(
            model_name="payment",
            name="verified_by",
        ),
        migrations.RemoveField(
            model_name="payment",
            name="verified_at",
        ),
        migrations.RemoveField(
            model_name="payment",
            name="verification_notes",
        ),
        migrations.AlterField(
            model_name="payment",
            name="payment_url",
            field=models.TextField(
                blank=True,
                help_text="Public URL ของสลิป (Supabase; object คือ payment/<payment_id>.png)",
            ),
        ),
    ]
