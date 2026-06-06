import { Redis } from '@upstash/redis';
import logger from '../utils/logger';

let _redis: Redis | null = null;

const getRedisClient = (): Redis => {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/^"|"$/g, '').trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.replace(/^"|"$/g, '').trim();

  if (!url || !token) {
    throw new Error('[redis] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set.');
  }

  _redis = new Redis({ url, token });
  return _redis;
};

// Lazy proxy — redis client is only instantiated on first use,
// ensuring dotenv.config() has already run in index.ts
export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return (getRedisClient() as any)[prop];
  },
});

export const connectRedis = async (): Promise<void> => {
  try {
    await getRedisClient().ping();
    logger.info('Upstash Redis connected');
  } catch (error) {
    logger.error('Upstash Redis connection failed', { error });
    // Non-fatal — app can run without cache
  }
};
