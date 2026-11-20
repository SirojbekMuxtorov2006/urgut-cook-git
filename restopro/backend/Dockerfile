FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# WeasyPrint (PDF) va psycopg uchun tizim kutubxonalari
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz0b libffi8 libjpeg62-turbo fonts-dejavu-core curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN chmod +x /app/entrypoint.sh \
    && DJANGO_SETTINGS_MODULE=config.settings.dev SECRET_KEY=build python manage.py collectstatic --noinput

RUN useradd -m -u 1000 app && chown -R app /app
USER app

EXPOSE 8000
ENTRYPOINT ["/app/entrypoint.sh"]
# HTTP + WebSocket: Gunicorn boshqaruvida Uvicorn worker'lari (ASGI)
CMD ["gunicorn", "config.asgi:application", "-k", "uvicorn.workers.UvicornWorker", \
     "-b", "0.0.0.0:8000", "-w", "4", "--timeout", "60", "--access-logfile", "-"]
