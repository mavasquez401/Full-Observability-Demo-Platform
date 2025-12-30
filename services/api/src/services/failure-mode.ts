/**
 * Failure mode service
 * Controls demo failure injection scenarios (latency, errors, DB stress)
 */

interface FailureConfig {
  latencyMs: number;
  errorRate: number; // 0.0 to 1.0
  dbStress: boolean;
}

const failureConfig = {
  latencyMs: 0,
  errorRate: 0,
  dbStress: false,
} as FailureConfig;

/**
 * Set failure mode configuration
 */
export function setFailureMode(config: Partial<FailureConfig>): void {
  if (config.latencyMs !== undefined) {
    failureConfig.latencyMs = Math.max(0, config.latencyMs);
  }
  if (config.errorRate !== undefined) {
    failureConfig.errorRate = Math.max(0, Math.min(1, config.errorRate));
  }
  if (config.dbStress !== undefined) {
    failureConfig.dbStress = config.dbStress;
  }
}

/**
 * Get current failure mode configuration
 */
export function getFailureMode(): FailureConfig {
  return { ...failureConfig };
}

/**
 * Apply latency if configured
 */
export async function applyLatency(): Promise<void> {
  if (failureConfig.latencyMs > 0) {
    await new Promise((resolve) =>
      setTimeout(resolve, failureConfig.latencyMs),
    );
  }
}

/**
 * Check if error should be injected
 */
export function shouldInjectError(): boolean {
  if (failureConfig.errorRate <= 0) {
    return false;
  }
  return Math.random() < failureConfig.errorRate;
}

/**
 * Apply database stress (simulate slow query)
 */
export async function applyDbStress<T>(fn: () => Promise<T>): Promise<T> {
  if (failureConfig.dbStress) {
    // Simulate slow query by adding delay
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 1000),
    );
  }
  return fn();
}
