import { FastifyPluginAsync } from 'fastify';
import { query, getClient } from '../db/client';
import { enqueueJob } from '../services/redis';
import { applyDbStress, applyLatency, shouldInjectError } from '../services/failure-mode';
import {
  ordersCreatedCounter,
  checkoutErrorsCounter,
  checkoutLatencyHistogram,
} from '../services/metrics';
import { CheckoutRequest } from '../types';
import { z } from 'zod';

/**
 * Orders routes
 * Handles order creation and listing
 */

// Validation schema for checkout
const checkoutSchema = z.object({
  user_id: z.string().min(1),
  items: z.array(
    z.object({
      product_id: z.number().int().positive(),
      quantity: z.number().int().positive(),
    })
  ),
});

const ordersRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /checkout - Create a new order
  fastify.post<{ Body: CheckoutRequest }>('/checkout', async (request, reply) => {
    const startTime = Date.now();

    // Apply failure modes (especially latency for checkout demo)
    await applyLatency();

    if (shouldInjectError()) {
      checkoutErrorsCounter.add(1);
      const latency = Date.now() - startTime;
      checkoutLatencyHistogram.record(latency);
      reply.code(500);
      return { error: 'Checkout failed (injected error)' };
    }

    try {
      // Validate request body
      const validated = checkoutSchema.parse(request.body);
      const { user_id, items } = validated;

      if (items.length === 0) {
        reply.code(400);
        return { error: 'Order must contain at least one item' };
      }

      // Start transaction - calculate total and create order
      const client = await getClient();

      try {
        await client.query('BEGIN');

        // Fetch products and calculate total
        let totalAmount = 0;
        const productIds = items.map((item) => item.product_id);

        const productsResult = await client.query(
          'SELECT id, price, stock FROM products WHERE id = ANY($1)',
          [productIds]
        );

        const productsMap = new Map(
          productsResult.rows.map((p) => [p.id, { price: parseFloat(p.price), stock: p.stock }])
        );

        // Validate stock and calculate total
        for (const item of items) {
          const product = productsMap.get(item.product_id);
          if (!product) {
            throw new Error(`Product ${item.product_id} not found`);
          }
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product ${item.product_id}`);
          }
          totalAmount += product.price * item.quantity;
        }

        // Apply DB stress if enabled (simulate slow query)
        await applyDbStress(async () => {
          await client.query('SELECT pg_sleep(0.1)');
        });

        // Create order
        const orderResult = await client.query(
          'INSERT INTO orders (user_id, status, total_amount) VALUES ($1, $2, $3) RETURNING *',
          [user_id, 'pending', totalAmount]
        );
        const order = orderResult.rows[0];
        const orderId = order.id;

        // Create order items
        for (const item of items) {
          const product = productsMap.get(item.product_id);
          await client.query(
            'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
            [orderId, item.product_id, item.quantity, product!.price]
          );

          // Update stock
          await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [
            item.quantity,
            item.product_id,
          ]);
        }

        await client.query('COMMIT');

        // Enqueue jobs for worker
        try {
          await enqueueJob('order_receipt', { order_id: orderId, user_id });
          await enqueueJob('invoice_generate', { order_id: orderId });
        } catch (jobError) {
          fastify.log.warn(jobError, 'Failed to enqueue jobs, but order was created');
        }

        // Emit metrics
        ordersCreatedCounter.add(1);
        const latency = Date.now() - startTime;
        checkoutLatencyHistogram.record(latency);

        reply.code(201);
        return {
          order: {
            id: order.id,
            user_id: order.user_id,
            status: order.status,
            total_amount: parseFloat(order.total_amount),
            created_at: order.created_at,
          },
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Error creating order');
      checkoutErrorsCounter.add(1);
      const latency = Date.now() - startTime;
      checkoutLatencyHistogram.record(latency);

      if (error instanceof z.ZodError) {
        reply.code(400);
        return { error: 'Invalid request', details: error.errors };
      }

      reply.code(500);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { error: 'Failed to create order', message };
    }
  });

  // GET /orders - List orders for a user
  fastify.get<{ Querystring: { user_id?: string } }>('/orders', async (request, reply) => {
    await applyLatency();

    if (shouldInjectError()) {
      reply.code(500);
      return { error: 'Internal server error (injected)' };
    }

    try {
      const userId = request.query.user_id || 'demo-user';

      const result = await applyDbStress(() =>
        query(
          `SELECT o.*, 
           COALESCE(
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'quantity', oi.quantity,
                 'price', oi.price
               )
             ) FILTER (WHERE oi.id IS NOT NULL),
             '[]'::json
           ) as items
           FROM orders o
           LEFT JOIN order_items oi ON o.id = oi.order_id
           WHERE o.user_id = $1
           GROUP BY o.id
           ORDER BY o.created_at DESC
           LIMIT 50`,
          [userId]
        )
      );

      return {
        orders: result.rows.map((row) => ({
          ...row,
          total_amount: parseFloat(row.total_amount),
        })),
        count: result.rows.length,
      };
    } catch (error) {
      fastify.log.error(error, 'Error fetching orders');
      reply.code(500);
      return { error: 'Failed to fetch orders' };
    }
  });
};

export default ordersRoutes;
