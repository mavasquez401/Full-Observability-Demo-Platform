/**
 * OpenTelemetry instrumentation placeholder for Next.js
 *
 * Note: Server-side OpenTelemetry instrumentation in Next.js has version
 * compatibility issues. For production use, consider:
 * 1. Datadog RUM for client-side observability
 * 2. Running Next.js with --experimental-instrumentation and dd-trace
 *
 * For this demo, tracing is handled by the API and worker services.
 */

export function initializeTelemetry(): void {
  // Telemetry initialization disabled for Next.js due to version conflicts
  // The API service handles distributed tracing for backend operations
  console.log('OpenTelemetry disabled for web service - see API/worker for tracing');
}
