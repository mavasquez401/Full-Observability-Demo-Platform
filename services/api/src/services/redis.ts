import { createClient } from 'redis';

/**
 * Redis client for queue operations
 * Used to enqueue jobs for the worker service
 */
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

// Connect to Redis
redisClient.connect().catch((err) => {
  console.error('Failed to connect to Redis', err);
});

/**
 * Enqueue a job to the Celery queue
 * Jobs are serialized as JSON and added to the Redis queue
 */
export async function enqueueJob(jobType: string, payload: Record<string, unknown>): Promise<void> {
  try {
    // Celery task format: simple JSON serialization for demo
    // In production, you'd use proper Celery serialization
    const taskMessage = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      task: `tasks.${jobType}`,
      args: [],
      kwargs: payload,
      retries: 0,
      eta: null,
    };

    // Add to Redis list (Celery uses lists for queues)
    await redisClient.lPush('celery', JSON.stringify(taskMessage));
  } catch (error) {
    console.error('Failed to enqueue job', error);
    throw error;
  }
}

