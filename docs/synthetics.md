# Datadog Synthetics Setup Guide

## Overview

Synthetic monitoring provides outside-in visibility by simulating user interactions from multiple locations.

## HTTP API Tests

### 1. Health Check Test

**Purpose**: Monitor API availability and basic health

**Steps**:
1. Navigate to: **Synthetics → New Test → API Test**
2. **Test Details**:
   - Name: "API Health Check"
   - URL: `http://localhost:3001/health` (or your deployed URL)
   - Method: GET
   - Locations: Select multiple locations (e.g., N. California, N. Virginia)
   - Frequency: Every 5 minutes

3. **Assertions**:
   - Status code is 200
   - Response time < 1000ms
   - Response body contains `"status":"healthy"`

4. **Monitor**: Create alert if test fails

### 2. Products Endpoint Test

**Purpose**: Monitor product listing endpoint

**Steps**:
1. Create new API test
2. **Test Details**:
   - Name: "Products List Endpoint"
   - URL: `http://localhost:3001/products`
   - Method: GET

3. **Assertions**:
   - Status code is 200
   - Response time < 2000ms
   - Response body contains `"products"`
   - Response is valid JSON

### 3. Checkout Endpoint Test

**Purpose**: Monitor critical checkout flow

**Steps**:
1. Create new API test
2. **Test Details**:
   - Name: "Checkout Endpoint"
   - URL: `http://localhost:3001/checkout`
   - Method: POST
   - Body (JSON):
     ```json
     {
       "user_id": "synthetic-test-user",
       "items": [
         {
           "product_id": 1,
           "quantity": 1
         }
       ]
     }
     ```
   - Headers: `Content-Type: application/json`

3. **Assertions**:
   - Status code is 201
   - Response time < 3000ms
   - Response body contains `"order"`
   - Response contains `"id"` field

## Browser Tests

### 1. Complete Checkout Flow

**Purpose**: End-to-end user journey test

**Steps**:
1. Navigate to: **Synthetics → New Test → Browser Test**
2. **Test Details**:
   - Name: "E-commerce Checkout Flow"
   - Starting URL: `http://localhost:3000` (or your deployed URL)
   - Locations: Select multiple locations
   - Frequency: Every 15 minutes

3. **Test Steps** (Record or manually add):
   - Navigate to homepage
   - Click on first product
   - Click "Add to Cart & Checkout" button
   - Wait for redirect to orders page
   - Assert order appears in order history

4. **Assertions**:
   - Page loads successfully
   - Order is created
   - Order status is visible

### Recording Steps:
- Use Datadog's browser extension to record the test
- Or use the Synthetics test recorder in the UI
- Play back the recorded steps to verify

## Advanced: Multi-Step API Test

### Complete Order Flow

**Purpose**: Test full order creation flow with multiple steps

**Steps**:
1. Create new **Multi-Step API Test**
2. **Step 1**: Get Products
   - URL: `GET /products`
   - Extract: `{{ products[0].id }}` → variable `product_id`

3. **Step 2**: Get Product Details
   - URL: `GET /products/{{ product_id }}`
   - Assert: Status 200

4. **Step 3**: Create Order (Checkout)
   - URL: `POST /checkout`
   - Body:
     ```json
     {
       "user_id": "synthetic-user",
       "items": [
         {
           "product_id": {{ product_id }},
           "quantity": 1
         }
       ]
     }
     ```
   - Extract: `{{ order.id }}` → variable `order_id`
   - Assert: Status 201

5. **Step 4**: Verify Order
   - URL: `GET /orders?user_id=synthetic-user`
   - Assert: Response contains `{{ order_id }}`

## Alerting

### Create Alert for Failed Tests

1. **Navigate**: Synthetics → Your Test → Edit → Alert Settings
2. **Configure**:
   - Alert on: Test failure
   - Notify: Your team's on-call channel
   - Include: Test results, screenshots (for browser tests), response details

### Alert Message Template

```
Synthetic test "{{test.name}}" failed.

Status: {{test.status}}
Location: {{test.location}}
Error: {{test.error}}

View test: {{test.url}}
```

## Best Practices

1. **Test Critical Paths**: Focus on user-facing critical flows (checkout, login, core features)

2. **Use Appropriate Frequency**:
   - Health checks: Every 1-5 minutes
   - Critical flows: Every 5-15 minutes
   - Non-critical: Every 30-60 minutes

3. **Multiple Locations**: Test from multiple geographic locations to catch regional issues

4. **Clean Up Test Data**: For checkout tests, use test user IDs or clean up created orders

5. **Monitor Test Results**: Review test results regularly and investigate flaky tests

6. **Integrate with CI/CD**: Use Synthetic CI/CD tests to validate deployments

## Synthetic CI/CD Integration (Optional)

Add synthetic tests to your CI/CD pipeline:

```yaml
# .github/workflows/synthetics.yml
name: Synthetics Tests
on:
  pull_request:
    branches: [main]

jobs:
  synthetics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Datadog Synthetics
        uses: DataDog/synthetics-ci-github-action@v0.15.0
        with:
          api_key: ${{ secrets.DD_API_KEY }}
          app_key: ${{ secrets.DD_APP_KEY }}
          test_search_query: 'tag:ci'
```

Tag your synthetic tests with `ci` to include them in CI runs.

## Troubleshooting

**Test Fails Immediately After Creation**:
- Verify URL is accessible from outside (not localhost)
- Check firewall rules
- Verify service is running

**Flaky Tests**:
- Increase timeout values
- Add retry logic
- Review test assertions (may be too strict)

**Browser Test Fails**:
- Check for dynamic content (add wait conditions)
- Verify selectors are stable
- Review screenshots for visual issues

