import { FastifyPluginAsync } from 'fastify';
import { query } from '../db/client';
import { applyDbStress, applyLatency, shouldInjectError } from '../services/failure-mode';

/**
 * Products routes
 * Handles product listing and detail endpoints
 */
const productsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /products - List all products
  fastify.get('/products', async (request, reply) => {
    // Apply failure modes
    await applyLatency();

    if (shouldInjectError()) {
      reply.code(500);
      return { error: 'Internal server error (injected)' };
    }

    try {
      const result = await applyDbStress(() => query('SELECT * FROM products ORDER BY id ASC'));

      return {
        products: result.rows,
        count: result.rows.length,
      };
    } catch (error) {
      fastify.log.error(error, 'Error fetching products');
      reply.code(500);
      return { error: 'Failed to fetch products' };
    }
  });

  // GET /products/:id - Get product by ID
  fastify.get<{ Params: { id: string } }>('/products/:id', async (request, reply) => {
    // Apply failure modes
    await applyLatency();

    if (shouldInjectError()) {
      reply.code(500);
      return { error: 'Internal server error (injected)' };
    }

    try {
      const productId = parseInt(request.params.id, 10);
      if (isNaN(productId)) {
        reply.code(400);
        return { error: 'Invalid product ID' };
      }

      const result = await applyDbStress(() =>
        query('SELECT * FROM products WHERE id = $1', [productId])
      );

      if (result.rows.length === 0) {
        reply.code(404);
        return { error: 'Product not found' };
      }

      return result.rows[0];
    } catch (error) {
      fastify.log.error(error, 'Error fetching product');
      reply.code(500);
      return { error: 'Failed to fetch product' };
    }
  });
};

export default productsRoutes;
