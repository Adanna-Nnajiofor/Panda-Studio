import { redis } from '../config/redis';
import logger from './logger';

const DEFAULT_TTL = 60 * 5; // 5 minutes

/**
 * Get a cached value. Returns null on miss or error.
 */
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await redis.get<T>(key);
    return value ?? null;
  } catch (error) {
    logger.error('[cache] GET failed', { key, error });
    return null;
  }
};

/**
 * Set a cached value with optional TTL in seconds (default 5 min).
 */
export const cacheSet = async (
  key: string,
  value: unknown,
  ttlSeconds = DEFAULT_TTL,
): Promise<void> => {
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    logger.error('[cache] SET failed', { key, error });
  }
};

/**
 * Delete a cached key.
 */
export const cacheDel = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch (error) {
    logger.error('[cache] DEL failed', { key, error });
  }
};

/**
 * Delete all keys matching a pattern prefix.
 * e.g. invalidatePattern('equipment:') clears all equipment cache entries.
 */
export const invalidatePattern = async (prefix: string): Promise<void> => {
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length > 0) {
      await Promise.all(keys.map((k) => redis.del(k)));
    }
  } catch (error) {
    logger.error('[cache] invalidatePattern failed', { prefix, error });
  }
};

/**
 * Cache-aside helper: returns cached value or fetches, caches, and returns fresh data.
 */
export const cacheAside = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = DEFAULT_TTL,
): Promise<T> => {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
};
