/**
 * OpenTelemetry instrumentation setup
 * Configures tracing, metrics, and log correlation for the API service
 */
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { Resource } from "@opentelemetry/resources";
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";

/**
 * Initialize OpenTelemetry SDK
 * Must be called before any other imports that use OpenTelemetry
 */
export function initializeTelemetry(): void {
  const serviceName = process.env.OTEL_SERVICE_NAME || "api";
  const serviceVersion = process.env.API_VERSION || "1.0.0";
  const otlpEndpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://otel-collector:4317";
  const environment = process.env.DD_ENV || "demo";
  const customerTier = process.env.CUSTOMER_TIER || "premium";
  const region = process.env.REGION || "us-east-1";

  // Resource attributes (tags that apply to all telemetry)
  const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: serviceVersion,
    "deployment.environment": environment,
    customer_tier: customerTier,
    region: region,
  });

  // OTLP exporters
  const traceExporter = new OTLPTraceExporter({
    url: `${otlpEndpoint}/v1/traces`,
  });

  const metricExporter = new OTLPMetricExporter({
    url: `${otlpEndpoint}/v1/metrics`,
  });

  // Initialize SDK
  const sdk = new NodeSDK({
    resource,
    spanProcessor: new BatchSpanProcessor(traceExporter),
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 10000, // Export metrics every 10 seconds
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Enable auto-instrumentation for common libraries
        "@opentelemetry/instrumentation-fs": {
          enabled: false, // Disable file system instrumentation for cleaner traces
        },
      }),
    ],
  });

  sdk.start();

  console.log(
    `OpenTelemetry initialized for ${serviceName} v${serviceVersion}`,
  );

  // Graceful shutdown
  process.on("SIGTERM", () => {
    sdk
      .shutdown()
      .then(() => console.log("OpenTelemetry terminated"))
      .catch((error) => console.error("Error terminating OpenTelemetry", error))
      .finally(() => process.exit(0));
  });
}
