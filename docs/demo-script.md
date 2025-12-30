# Demo Script - Full Observability Demo Platform

## Overview

A 10-15 minute walkthrough demonstrating comprehensive observability with OpenTelemetry and Datadog.

## Pre-Demo Setup

1. Ensure all services are running: `make up`
2. Verify Datadog Agent is healthy: Check container logs
3. Open Datadog APM dashboard in your browser
4. Have the demo user flow ready: http://localhost:3000

## Demo Flow

### 1. Healthy System Baseline (2-3 minutes)

**Goal**: Show a working system with full observability coverage.

**Actions**:
- Navigate to http://localhost:3000
- Browse products page
- Click on a product
- Add to cart and checkout
- View order history

**What to Show in Datadog**:
- **APM Service Map**: Show services (web → api → postgres, api → redis → worker)
- **Traces**: Click on a checkout trace, show end-to-end flow
- **Logs**: Show correlated logs with trace IDs
- **Metrics**: Show custom metrics (orders.created, checkout.latency)

**Key Points**:
- "Notice how we have full visibility across all services"
- "Every request creates a distributed trace"
- "Logs are automatically correlated with traces"
- "Business metrics are flowing to Datadog"

### 2. Latency Injection Scenario (3-4 minutes)

**Goal**: Demonstrate how observability helps detect and diagnose latency issues.

**Actions**:
1. Enable latency injection:
   ```bash
   curl -X POST http://localhost:3001/admin/failure-mode \
     -H "Content-Type: application/json" \
     -d '{"latency_ms": 2000}'
   ```
2. Perform a checkout from the web UI
3. Show how latency is visible in Datadog

**What to Show in Datadog**:
- **APM Services**: Show p95 latency spike on API service
- **Traces**: Show breakdown - where time is spent (database, Redis, etc.)
- **Flame Graph**: Demonstrate trace visualization
- **Service Map**: Show which services are impacted

**Key Points**:
- "Our p95 latency monitor would alert us immediately"
- "We can see exactly where the latency is introduced"
- "Trace breakdown shows us the bottleneck"

### 3. Error Rate Spike (3-4 minutes)

**Goal**: Show error detection and root cause analysis.

**Actions**:
1. Enable error injection:
   ```bash
   curl -X POST http://localhost:3001/admin/failure-mode \
     -H "Content-Type: application/json" \
     -d '{"error_rate": 0.5}'
   ```
2. Perform multiple checkouts (some will fail)
3. Show errors in Datadog

**What to Show in Datadog**:
- **APM Error Rate**: Show error rate graph
- **Error Traces**: Click on error traces, show stack traces
- **Error Insights**: Show top errors and their frequency
- **Logs**: Show error logs with trace correlation

**Key Points**:
- "Error rate monitor would alert our team"
- "We can see the exact error and stack trace"
- "Logs are automatically linked to error traces"
- "We know immediately which users are affected"

### 4. Database Stress Scenario (2-3 minutes)

**Goal**: Demonstrate database performance monitoring.

**Actions**:
1. Enable DB stress mode:
   ```bash
   curl -X POST http://localhost:3001/admin/failure-mode \
     -H "Content-Type: application/json" \
     -d '{"db_stress": true}'
   ```
2. Perform checkout operations
3. Show database spans and metrics

**What to Show in Datadog**:
- **Database Spans**: Show slow query spans in traces
- **PostgreSQL Metrics**: Show connection pool, query duration
- **Trace Breakdown**: Show time spent in database queries

**Key Points**:
- "We can see slow database queries in our traces"
- "PostgreSQL metrics show connection pool utilization"
- "This helps us identify N+1 queries or missing indexes"

### 5. Queue Backlog Scenario (2-3 minutes)

**Goal**: Show worker/queue monitoring.

**Actions**:
1. Enable slow consumer mode:
   ```bash
   docker compose -f infra/compose/docker-compose.yml exec worker \
     env SLOW_CONSUMER=true celery -A app.celery_app worker --loglevel=info
   ```
   (Or set environment variable and restart worker)
2. Perform multiple checkouts (creates jobs)
3. Show queue depth and worker metrics

**What to Show in Datadog**:
- **Worker Traces**: Show Celery task execution times
- **Queue Metrics**: Show job queue depth (if instrumented)
- **Worker Logs**: Show job processing logs

**Key Points**:
- "We can see worker task execution in our traces"
- "Queue depth metrics help us scale workers proactively"
- "Worker logs show job processing status"

### 6. Wrap-up (1-2 minutes)

**Summary Points**:
- Full observability with OpenTelemetry + Datadog
- Distributed tracing across microservices
- Log correlation with traces
- Business metrics tracking
- Automatic service map generation
- Proactive alerting on golden signals

## Reset After Demo

```bash
# Reset failure modes
curl -X POST http://localhost:3001/admin/failure-mode \
  -H "Content-Type: application/json" \
  -d '{"latency_ms": 0, "error_rate": 0, "db_stress": false}'

# Reset database (optional)
make db-reset
```

