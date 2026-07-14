import { createClient } from 'redis';
import logger from '../utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl
});

redisClient.on('connect', () => {
  logger.info('Connecting to Redis...');
});

redisClient.on('ready', () => {
  logger.info('Successfully connected to Redis.');
});

let lastLoggedErrorTime = 0;
redisClient.on('error', (err) => {
  const now = Date.now();
  if (now - lastLoggedErrorTime > 60000) {
    if ((err as any).code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
      logger.warn('Redis cache is offline. Server is running in fail-open mode (direct MongoDB query fallback).');
    } else {
      logger.error('Redis Client Error:', err.message || err);
    }
    lastLoggedErrorTime = now;
  }
});

redisClient.on('end', () => {
  logger.warn('Redis connection closed.');
});

export async function connectRedis(): Promise<void> {
  try {
    if (!redisClient.isOpen) {
      // Connect asynchronously so it does not block Express server boot if Redis is offline on developer systems
      redisClient.connect().catch(err => {
        logger.error('Redis connection failed on initial attempt:', err);
      });
    }
  } catch (error) {
    logger.error('Failed to initialize Redis connection:', error);
  }
}

export { redisClient };
