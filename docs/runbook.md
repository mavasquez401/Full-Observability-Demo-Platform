# Incident Response Runbook

## Incident Scenario: Checkout Latency Spike

### Detection

**Symptoms**:
- p95 latency > 1 second on `/checkout` endpoint
- User reports slow checkout experience
- Error rate may or may not be elevated

**Initial Detection**:
1. Monitor alert triggers: `p95 latency > 1s on service:api, endpoint:/checkout`
2. Check Datadog APM → Services → api → Latency graph
3. Confirm spike is sustained (> 5 minutes)

### Triage

**Step 1: Identify Affected Service**
- Navigate to: **APM → Service Map**
- Look for red/orange services (high latency)
- Identify which service is the bottleneck

**Step 2: Check Service-Level Metrics**
- Navigate to: **APM → Services → api**
- Review:
  - Latency breakdown (p50, p95, p99)
  - Error rate
  - Request rate (traffic)
  - Resource utilization (CPU, memory)

**Step 3: Examine Traces**
- Navigate to: **APM → Services → api → Traces**
- Filter by: `resource_name:POST /checkout`
- Sort by: Duration (descending)
- Click on a slow trace to see breakdown

### Root Cause Analysis

**Trace Analysis**:
1. Open a slow trace from the list
2. Examine the **Flame Graph**:
   - Which spans take the most time?
   - Are database queries slow?
   - Is Redis slow?
   - Is there external API latency?

**Common Scenarios**:

**Scenario A: Database Slow Queries**
- **Indicator**: Long `pg.query` spans in trace
- **Action**:
  1. Click on database span
  2. Check query execution time
  3. View PostgreSQL metrics: **Infrastructure → PostgreSQL**
  4. Check for connection pool exhaustion
  5. Look for slow query patterns

**Scenario B: Redis Latency**
- **Indicator**: Long `redis.command` spans
- **Action**:
  1. Check Redis metrics: **Infrastructure → Redis**
  2. Check connection pool and memory usage
  3. Verify Redis is healthy

**Scenario C: Worker Queue Backlog**
- **Indicator**: Jobs not processing quickly
- **Action**:
  1. Check worker service: **APM → Services → worker**
  2. Review Celery task execution times
  3. Check queue depth metrics
  4. Verify worker is consuming jobs

**Scenario D: Application Code Issue**
- **Indicator**: Slow spans in application code (not DB/Redis)
- **Action**:
  1. Check application logs: **Logs → service:api**
  2. Filter by trace ID from the slow trace
  3. Look for errors or warnings
  4. Check for recent deployments

### Investigation Queries

**Datadog Logs Query**:
```
service:api resource_name:"POST /checkout" @duration:>1000
```

**Trace Query**:
```
service:api resource_name:"POST /checkout" @duration:>1000
```

**Metric Query** (for dashboard):
```
avg:trace.api.request.duration.by.service.by.resource{service:api,resource_name:POST /checkout}.as_p95()
```

### Resolution Steps

**Immediate Actions**:
1. **If database issue**:
   - Check PostgreSQL connection pool
   - Review slow query log
   - Consider scaling database or optimizing query

2. **If Redis issue**:
   - Check Redis memory and connections
   - Verify Redis is not overwhelmed
   - Consider scaling Redis

3. **If worker backlog**:
   - Scale worker instances
   - Check worker health
   - Review job processing time

4. **If application issue**:
   - Check recent deployments
   - Review application logs
   - Consider rollback if recent deploy

**Verification**:
- Monitor latency graph for improvement
- Verify error rate returns to baseline
- Confirm user reports stop

### Post-Incident

1. **Document Learnings**:
   - Root cause
   - Resolution steps taken
   - Timeline of events

2. **Create/Update Monitors**:
   - Add more specific alerts if needed
   - Tune alert thresholds

3. **Optimization**:
   - Fix slow queries
   - Optimize code paths
   - Improve error handling

## Example: Latency Injection Incident

**Detection**: 
- Alert: `p95 latency > 2s on service:api`

**Triage**:
1. Service Map shows api service is red
2. Latency graph shows p95 = 2500ms
3. Error rate is normal

**Root Cause**:
- Open slow trace → See artificial delay in application code
- Check logs: No errors, just slow execution
- Review code: Latency injection is enabled

**Resolution**:
- Disable latency injection via admin API:
  ```bash
  curl -X POST http://localhost:3001/admin/failure-mode \
    -H "Content-Type: application/json" \
    -d '{"latency_ms": 0}'
  ```
- Verify latency returns to baseline

