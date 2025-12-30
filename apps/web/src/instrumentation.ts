/**
 * OpenTelemetry instrumentation for Next.js
 * This file is automatically called by Next.js when the server starts
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Only run on the server side (not in Edge runtime)
    const { initializeTelemetry } = await import("./lib/telemetry");
    initializeTelemetry();
  }
}
