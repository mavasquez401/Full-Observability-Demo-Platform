"""
OpenTelemetry instrumentation setup for Python worker
Configures tracing and metrics for Celery tasks
"""
import os
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import (
    Resource,
    SERVICE_NAME,
    SERVICE_VERSION,
    DEPLOYMENT_ENVIRONMENT,
)
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.instrumentation.celery import CeleryInstrumentor

try:
    from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
except ImportError:
    Psycopg2Instrumentor = None

try:
    from opentelemetry.instrumentation.redis import RedisInstrumentor
except ImportError:
    RedisInstrumentor = None


def initialize_telemetry():
    """Initialize OpenTelemetry for the worker service"""
    service_name = os.getenv("OTEL_SERVICE_NAME", "worker")
    service_version = os.getenv("WORKER_VERSION", "1.0.0")
    environment = os.getenv("DD_ENV", "demo")
    customer_tier = os.getenv("CUSTOMER_TIER", "premium")
    region = os.getenv("REGION", "us-east-1")
    otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317")

    # Resource attributes (tags)
    resource = Resource.create(
        {
            SERVICE_NAME: service_name,
            SERVICE_VERSION: service_version,
            DEPLOYMENT_ENVIRONMENT: environment,
            "customer_tier": customer_tier,
            "region": region,
        }
    )

    # Tracer provider
    tracer_provider = TracerProvider(resource=resource)
    trace_exporter = OTLPSpanExporter(endpoint=f"{otlp_endpoint}/v1/traces")
    tracer_provider.add_span_processor(BatchSpanProcessor(trace_exporter))
    trace.set_tracer_provider(tracer_provider)

    # Meter provider
    meter_provider = MeterProvider(
        resource=resource,
        metric_readers=[
            PeriodicExportingMetricReader(
                OTLPMetricExporter(endpoint=f"{otlp_endpoint}/v1/metrics"),
                export_interval_millis=10000,  # Export every 10 seconds
            )
        ],
    )
    metrics.set_meter_provider(meter_provider)

    # Instrument libraries
    CeleryInstrumentor().instrument()
    if Psycopg2Instrumentor:
        Psycopg2Instrumentor().instrument(enable_commenter=True, commenter_options={})
    if RedisInstrumentor:
        RedisInstrumentor().instrument()

    print(f"OpenTelemetry initialized for {service_name} v{service_version}")


# Initialize when module is imported
initialize_telemetry()
