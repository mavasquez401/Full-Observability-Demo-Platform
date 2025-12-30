"""
Celery application configuration
"""
# Initialize OpenTelemetry FIRST
from app.instrumentation import initialize_telemetry
initialize_telemetry()

from celery import Celery
import os

# Create Celery instance
celery_app = Celery(
    'worker',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),
    include=['app.tasks.order_receipt', 'app.tasks.invoice_generate'],
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
)

