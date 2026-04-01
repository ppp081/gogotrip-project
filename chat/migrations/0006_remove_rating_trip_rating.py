# Generated manually for schema change

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0005_user_auth_user"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="rating",
            name="trip_rating",
        ),
    ]
