// Minimal cache helpers.
// Some controllers reference these utilities; if you already have a cache implementation,
// this file may be unused.

export const cacheAside = async <T>(
  _key: string,
  fetchFn: () => Promise<T>,
  _ttlSeconds: number,
): Promise<T> => {
  return fetchFn();
};

export const cacheDel = async (_key: string): Promise<void> => {};

export const invalidatePattern = async (_pattern: string): Promise<void> => {};
