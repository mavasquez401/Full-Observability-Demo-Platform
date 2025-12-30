"""
Structured logging configuration
Uses structlog for JSON logging with trace correlation
"""
import structlog
import sys
import json
from typing import Any


def add_trace_context(logger, method_name, event_dict):
    """
    Add OpenTelemetry trace context to log records
    This allows correlation between logs and traces in Datadog
    """
    # Get trace context from OpenTelemetry
    try:
        from opentelemetry import trace

        span = trace.get_current_span()
        if span:
            span_context = span.get_span_context()
            if span_context.is_valid:
                # Format trace ID and span ID as hex strings
                event_dict["trace_id"] = format(span_context.trace_id, "032x")
                event_dict["span_id"] = format(span_context.span_id, "016x")
    except Exception:
        pass  # If OTel not available, skip trace context

    return event_dict


def configure_logging():
    """Configure structlog for JSON output"""
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            add_trace_context,
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


# Configure logging when module is imported
configure_logging()
