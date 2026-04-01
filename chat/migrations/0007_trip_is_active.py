# Generated manually for Trip.is_active (hide from public listings)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0006_remove_rating_trip_rating"),
    ]

    operations = [
        migrations.AddField(
            model_name="trip",
            name="is_active",
            field=models.BooleanField(db_index=True, default=True),
        ),
    ]
