import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let host = 'localhost';
let port = 6379;

try {
  if (redisUrl.includes('://')) {
    const url = new URL(redisUrl);
    host = url.hostname || 'localhost';
    port = parseInt(url.port || '6379', 10);
  } else {
    const parts = redisUrl.split(':');
    host = parts[0];
    port = parseInt(parts[1] || '6379', 10);
  }
} catch (e) {
  logger.warn('Could not parse Redis URL. Falling back to localhost:6379 for BullMQ worker connection.');
}

// IORedis connection options with null retries (BullMQ constraint)
export const redisConnection = new IORedis({
  host,
  port,
  maxRetriesPerRequest: null
});

redisConnection.on('connect', () => {
  logger.info('BullMQ IORedis connection established.');
});

let lastLoggedErrorTime = 0;
redisConnection.on('error', (err: any) => {
  const now = Date.now();
  if (now - lastLoggedErrorTime > 60000) {
    if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
      logger.warn('BullMQ Redis queue is offline. Background worker tasks are suspended.');
    } else {
      logger.error('BullMQ IORedis connection error:', err.message || err);
    }
    lastLoggedErrorTime = now;
  }
});

export const aiQueue = new Queue('ai-processing', { connection: redisConnection });

export default aiQueue;
