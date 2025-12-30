# Worker Service

Celery worker service for processing background jobs (order receipts, invoice generation).

## Setup

```bash
poetry install
```

## Run Worker

```bash
poetry run celery -A app.celery_app worker --loglevel=info
```

## Environment Variables

- `CELERY_BROKER_URL`: Redis broker URL (default: `redis://localhost:6379/0`)
- `CELERY_RESULT_BACKEND`: Redis result backend (default: `redis://localhost:6379/0`)
- `DATABASE_URL`: PostgreSQL connection string
- `SLOW_CONSUMER`: Enable slow consumer mode for demo (default: `false`)

