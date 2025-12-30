"""
Entry point for running the worker
"""
from app.celery_app import celery_app

if __name__ == "__main__":
    celery_app.start()
