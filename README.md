# Full Observability Demo Platform

A production-style microservices demo platform optimized for Datadog Sales Engineering demos. Demonstrates comprehensive observability with OpenTelemetry, distributed tracing, structured logging, custom metrics, and Datadog APM integration.

## Tech Stack

- **Frontend**: Next.js 14+ (React, TypeScript)
- **API Service**: Fastify (Node.js, TypeScript)
- **Worker Service**: FastAPI + Celery (Python)
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **Observability**: OpenTelemetry SDKs + Collector, Datadog Agent + APM
- **UI Components**: shadcn/ui + Lucide icons

## Quick Start (One Command Demo)

```bash
make up
```

This single command will:
- Start all services (web, api, worker, postgres, redis)
- Start OpenTelemetry Collector
- Start Datadog Agent
- Run database migrations
- Seed demo data
- Open the app at `http://localhost:3000`

## Prerequisites

- Docker & Docker Compose
- Make (or use `just` if preferred)
- Datadog API key and App key (for Datadog Agent)

## Setup

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Add your Datadog credentials to `.env`:
   ```bash
   DD_API_KEY=your_api_key
   DD_APP_KEY=your_app_key
   ```

3. Start the platform:
   ```bash
   make up
   ```

## Project Structure

```
.
├── apps/
│   └── web/              # Next.js frontend
├── services/
│   ├── api/              # Fastify API service
│   └── worker/           # Celery worker service
├── infra/
│   └── compose/          # Docker Compose configuration
├── otel/
│   └── collector/        # OpenTelemetry Collector config
└── docs/                 # Documentation, runbooks, demo scripts
```

## Observability Features

- **Distributed Tracing**: End-to-end traces across frontend → API → worker → database
- **Structured Logging**: JSON logs with trace correlation IDs
- **Custom Metrics**: Business metrics (orders/min, checkout errors, queue depth)
- **Service Map**: Automatic dependency visualization in Datadog
- **Failure Injection**: Demo toggles for latency, errors, and resource stress

## Demo Scenarios

See `docs/demo-script.md` for a complete 10-15 minute demo walkthrough.

Key scenarios:
1. Healthy system baseline
2. Latency injection on checkout
3. Error rate spikes
4. Database connection exhaustion
5. Queue backlog accumulation

## Development

### Running Individual Services

```bash
# Frontend only
cd apps/web && npm run dev

# API only
cd services/api && npm run dev

# Worker only
cd services/worker && poetry run celery -A app worker --loglevel=info
```

### Database Migrations

```bash
make db-reset  # Reset and reseed database
```

### Code Quality

```bash
make lint      # Run all linters
make format    # Format all code
make test      # Run all tests
```

## Environment Variables

Key environment variables (see `.env.example` for full list):

- `DD_API_KEY`: Datadog API key (required)
- `DD_APP_KEY`: Datadog App key (required)
- `DD_ENV`: Environment name (dev, demo)
- `DD_SERVICE`: Service name (web, api, worker)
- `DD_VERSION`: Service version
- `CUSTOMER_TIER`: Customer tier tag (premium, standard)
- `REGION`: Deployment region (us-east-1, eu-west-1)

## Notes

### Celery Integration

The current implementation uses a simplified Redis queue pattern for job enqueuing. In production, you would use the official Celery client library (`celery` npm package or `celery` Python package) to properly serialize and enqueue tasks. The current implementation demonstrates the queue pattern and observability instrumentation, which is the focus of this demo platform.

### Getting Started Checklist

1. ✅ Copy `.env.example` to `.env` and add your Datadog API key
2. ✅ Run `make up` to start all services
3. ✅ Access the web UI at http://localhost:3000
4. ✅ Check Datadog APM to see traces appearing
5. ✅ Follow the [demo script](docs/demo-script.md) for a complete walkthrough

## License

MIT

