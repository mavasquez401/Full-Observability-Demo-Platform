/**
 * OpenTelemetry instrumentation setup for Next.js
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

let sdk: NodeSDK | undefined = undefined;

/**
 * Initialize OpenTelemetry SDK for Next.js
 */
export function initializeTelemetry(): void {
  // Only initialize once
  if (sdk) {
    return;
  }

  const serviceName = process.env.OTEL_SERVICE_NAME || 'web';
  const serviceVersion = process.env.WEB_VERSION || '1.0.0';
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4317';
  const environment = process.env.NEXT_PUBLIC_APP_ENV || 'demo';
  const customerTier = process.env.CUSTOMER_TIER || 'premium';
  const region = process.env.REGION || 'us-east-1';

  // Resource attributes
  const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: serviceVersion,
    'deployment.environment': environment,
    'customer_tier': customerTier,
    'region': region,
  });

  // OTLP exporters
  const traceExporter = new OTLPTraceExporter({
    url: `${otlpEndpoint}/v1/traces`,
  });

  const metricExporter = new OTLPMetricExporter({
    url: `${otlpEndpoint}/v1/metrics`,
  });

  // Initialize SDK
  sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 10000,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
      }),
    ],
  });

  sdk.start();

  console.log(`OpenTelemetry initialized for ${serviceName} v${serviceVersion}`);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk
      ?.shutdown()
      .then(() => console.log('OpenTelemetry terminated'))
      .catch((error) => console.error('Error terminating OpenTelemetry', error))
      .finally(() => process.exit(0));
  });
}

