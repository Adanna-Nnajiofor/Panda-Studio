import { Redis } from '@upstash/redis';
import logger from '../utils/logger';

let _redis: Redis | null = null;
let _redisUnavailable = false;

const getRedisClient = (): Redis | null => {
  if (_redisUnavailable) return null;
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/^"|"$/g, '').trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.replace(/^"|"$/g, '').trim();

  if (!url || !token) {
    _redisUnavailable = true;
    logger.warn('[redis] not configured — cache disabled');
    return null;
  }

  _redis = new Redis({ url, token });
  return _redis;
};

const noopAsync = async () => undefined;
const noopNull = async () => null;

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const client = getRedisClient();
    if (!client) {
      if (prop === 'get') return noopNull;
      if (prop === 'set') return noopAsync;
      if (prop === 'del') return noopAsync;
      if (prop === 'keys') return async () => [] as string[];
      if (prop === 'ping') return async () => 'PONG';
      return noopAsync;
    }
    return (client as any)[prop];
  },
});

export const connectRedis = async (): Promise<void> => {
  try {
    const client = getRedisClient();
    if (!client) return;
    await client.ping();
    logger.info('Upstash Redis connected');
  } catch (error) {
    _redisUnavailable = true;
    _redis = null;
    logger.error('Upstash Redis connection failed — cache disabled', { error });
  }
};
