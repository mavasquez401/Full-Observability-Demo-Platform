# Datadog Dashboards and Monitors

## Golden Signals Dashboard

Create a dashboard called "Observability Demo - Golden Signals" with the following widgets:

### 1. Service-Level Overview

**Widget: Service Map**
- Type: Service Map
- Shows: Automatic service dependencies
- Purpose: Visual overview of system architecture

**Widget: Service List**
- Type: List
- Metric: `trace.api.request.hits`
- Group by: `service`
- Shows: Request rate per service

### 2. Latency Panel

**Widget: API Latency (p95)**
- Type: Timeseries
- Query:
  ```
  avg:trace.api.request.duration.by.service.by.resource{service:api}.as_p95()
  ```
- Title: "API Service - p95 Latency"
- Y-axis: milliseconds

**Widget: Web Latency (p95)**
- Type: Timeseries
- Query:
  ```
  avg:trace.web.request.duration.by.service.by.resource{service:web}.as_p95()
  ```
- Title: "Web Service - p95 Latency"

**Widget: Worker Task Duration**
- Type: Timeseries
- Query:
  ```
  avg:trace.celery.task.duration.by.service.by.name{service:worker}.as_p95()
  ```
- Title: "Worker Tasks - p95 Duration"

### 3. Traffic Panel

**Widget: Request Rate by Service**
- Type: Timeseries
- Query:
  ```
  sum:trace.api.request.hits{*}.as_rate()
  ```
- Title: "Requests per Second"

**Widget: Request Rate by Endpoint**
- Type: Timeseries
- Query:
  ```
  sum:trace.api.request.hits{service:api} by {resource_name}.as_rate()
  ```
- Title: "API Request Rate by Endpoint"

### 4. Error Rate Panel

**Widget: Error Rate by Service**
- Type: Timeseries
- Query:
  ```
  sum:trace.api.request.errors{*}.as_rate()
  ```
- Title: "Error Rate (requests/sec)"

**Widget: Error Rate by Endpoint**
- Type: Timeseries
- Query:
  ```
  sum:trace.api.request.errors{service:api} by {resource_name}.as_rate()
  ```
- Title: "Error Rate by Endpoint"

### 5. Business Metrics Panel

**Widget: Orders Created**
- Type: Timeseries
- Query:
  ```
  sum:orders.created{*}.as_rate()
  ```
- Title: "Orders Created per Minute"

**Widget: Checkout Errors**
- Type: Timeseries
- Query:
  ```
  sum:checkout.errors{*}.as_rate()
  ```
- Title: "Checkout Errors per Minute"

**Widget: Checkout Latency**
- Type: Histogram
- Query:
  ```
  avg:checkout.latency{*}
  ```
- Title: "Checkout Latency Distribution"

### 6. Saturation Panel

**Widget: Database Connections**
- Type: Timeseries
- Query:
  ```
  avg:postgresql.connections{*}
  ```
- Title: "PostgreSQL Active Connections"

**Widget: Redis Memory**
- Type: Timeseries
- Query:
  ```
  avg:redis.memory.used{*}
  ```
- Title: "Redis Memory Usage"

**Widget: Worker Jobs Completed**
- Type: Timeseries
- Query:
  ```
  sum:worker.jobs.completed{*}.as_rate()
  ```
- Title: "Worker Jobs Completed per Minute"

## Monitors

### 1. API Latency Monitor

**Name**: "API Service - High p95 Latency"

**Type**: Metric Alert

**Query**:
```
avg(last_5m):avg:trace.api.request.duration.by.service.by.resource{service:api}.as_p95() > 1000
```

**Thresholds**:
- Warning: > 500ms
- Critical: > 1000ms

**Message**:
```
API service p95 latency is {{value}}ms (threshold: {{threshold}}ms).

Check APM → Services → api for trace breakdown.
{{#is_alert}}
@oncall
{{/is_alert}}
```

### 2. Error Rate Monitor

**Name**: "API Service - High Error Rate"

**Type**: Metric Alert

**Query**:
```
avg(last_5m):sum:trace.api.request.errors{service:api}.as_rate() > 0.05
```

**Thresholds**:
- Warning: > 0.01 (1% error rate)
- Critical: > 0.05 (5% error rate)

**Message**:
```
API service error rate is {{value}} errors/sec (threshold: {{threshold}}).

Check APM → Services → api → Errors for details.
{{#is_alert}}
@oncall
{{/is_alert}}
```

### 3. Checkout Endpoint Latency

**Name**: "Checkout Endpoint - High Latency"

**Type**: Metric Alert

**Query**:
```
avg(last_5m):avg:trace.api.request.duration.by.service.by.resource{service:api,resource_name:POST /checkout}.as_p95() > 2000
```

**Thresholds**:
- Warning: > 1000ms
- Critical: > 2000ms

**Message**:
```
Checkout endpoint p95 latency is {{value}}ms.

Business impact: Users experiencing slow checkout.
Check APM → Traces for slow checkout requests.
{{#is_alert}}
@oncall
{{/is_alert}}
```

### 4. Database Connection Pool Exhaustion

**Name**: "PostgreSQL - High Connection Count"

**Type**: Metric Alert

**Query**:
```
avg(last_5m):avg:postgresql.connections{*} > 80
```

**Thresholds**:
- Warning: > 60 connections
- Critical: > 80 connections (assuming max 100)

**Message**:
```
PostgreSQL connection count is {{value}} (threshold: {{threshold}}).

Risk of connection pool exhaustion.
Check Infrastructure → PostgreSQL for details.
{{#is_alert}}
@oncall
{{/is_alert}}
```

### 5. Worker Queue Backlog (if instrumented)

**Name**: "Worker - High Queue Depth"

**Type**: Metric Alert

**Query**:
```
avg(last_5m):avg:queue.depth{*} > 100
```

**Thresholds**:
- Warning: > 50
- Critical: > 100

**Message**:
```
Worker queue depth is {{value}} jobs (threshold: {{threshold}}).

Jobs are backing up. Consider scaling workers.
Check APM → Services → worker for task execution times.
{{#is_alert}}
@oncall
{{/is_alert}}
```

## Dashboard JSON Export

To create the dashboard programmatically, use the Datadog API or export the dashboard JSON from the Datadog UI after creating it manually.

## Best Practices

1. **Group Related Metrics**: Use sections in the dashboard to group related metrics (Latency, Traffic, Errors, Saturation)

2. **Use Appropriate Time Windows**: 
   - Default: Last 1 hour
   - For historical analysis: Last 24 hours or 7 days

3. **Add Annotations**: Mark deployments, incidents, and changes on the dashboard timeline

4. **Share Dashboards**: Share with team members for visibility

5. **Review Regularly**: Review dashboard during daily standups or weekly reviews

