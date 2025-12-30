import { FastifyPluginAsync } from 'fastify';
import { setFailureMode, getFailureMode } from '../services/failure-mode';
import { FailureModeConfig } from '../types';
import { z } from 'zod';

/**
 * Admin routes
 * Failure mode toggles for demo scenarios
 */

const failureModeSchema = z.object({
  latency_ms: z.number().int().min(0).optional(),
  error_rate: z.number().min(0).max(1).optional(),
  db_stress: z.boolean().optional(),
});

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /admin/failure-mode - Set failure mode configuration
  fastify.post<{ Body: FailureModeConfig }>('/admin/failure-mode', async (request, reply) => {
    try {
      const validated = failureModeSchema.parse(request.body);

      setFailureMode({
        latencyMs: validated.latency_ms ?? 0,
        errorRate: validated.error_rate ?? 0,
        dbStress: validated.db_stress ?? false,
      });

      const current = getFailureMode();

      return {
        message: 'Failure mode updated',
        config: {
          latency_ms: current.latencyMs,
          error_rate: current.errorRate,
          db_stress: current.dbStress,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400);
        return { error: 'Invalid request', details: error.errors };
      }

      fastify.log.error(error, 'Error setting failure mode');
      reply.code(500);
      return { error: 'Failed to set failure mode' };
    }
  });

  // GET /admin/failure-mode - Get current failure mode configuration
  fastify.get('/admin/failure-mode', async () => {
    const config = getFailureMode();
    return {
      config: {
        latency_ms: config.latencyMs,
        error_rate: config.errorRate,
        db_stress: config.dbStress,
      },
    };
  });
};

export default adminRoutes;

