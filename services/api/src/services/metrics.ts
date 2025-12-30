/**
 * Custom metrics service
 * Emits business metrics via OpenTelemetry
 */
import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("observability-demo-api", "1.0.0");

// Counter for orders created
export const ordersCreatedCounter = meter.createCounter("orders.created", {
  description: "Total number of orders created",
});

// Counter for checkout errors
export const checkoutErrorsCounter = meter.createCounter("checkout.errors", {
  description: "Total number of checkout errors",
});

// Histogram for checkout latency
export const checkoutLatencyHistogram = meter.createHistogram(
  "checkout.latency",
  {
    description: "Checkout request latency in milliseconds",
    unit: "ms",
  },
);
