
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /code
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt
COPY . .
ARG DJANGO_SECRET_KEY_BUILD=collectstatic-build-only
ENV DJANGO_SECRET_KEY=$DJANGO_SECRET_KEY_BUILD
ENV DJANGO_BUILD_PHASE=1
RUN python manage.py collectstatic --noinput --clear
ENV DJANGO_BUILD_PHASE=
ENV DJANGO_SECRET_KEY=

CMD ["sh", "-c", "exec daphne -b 0.0.0.0 -p ${PORT:-8080} tripbot.asgi:application"]