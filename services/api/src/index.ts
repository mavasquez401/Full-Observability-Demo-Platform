// Initialize OpenTelemetry FIRST, before any other imports
import { initializeTelemetry } from './instrumentation';
initializeTelemetry();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import { query } from './db/client';

/**
 * Fastify API server
 * Main entry point for the API service
 */

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        headers: req.headers,
      }),
    },
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

// Add trace correlation to logs using OpenTelemetry context
server.addHook('onRequest', async (request) => {
  const { trace } = await import('@opentelemetry/api');
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    const spanContext = activeSpan.spanContext();
    if (spanContext.traceId && spanContext.spanId) {
      request.log = request.log.child({
        trace_id: spanContext.traceId,
        span_id: spanContext.spanId,
      });
    }
  }
});

// Register plugins
server.register(helmet);
server.register(cors, {
  origin: true, // Allow all origins in demo (restrict in production)
});

// Health check endpoint
server.get('/health', async () => {
  try {
    // Check database connection
    await query('SELECT 1');
    return { status: 'healthy', service: 'api' };
  } catch (error) {
    server.log.error(error, 'Health check failed');
    return { status: 'unhealthy', service: 'api' };
  }
});

// Register routes
server.register(productsRoutes);
server.register(ordersRoutes);
server.register(adminRoutes, { prefix: '/admin' });

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    server.log.info(`API server listening on ${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
