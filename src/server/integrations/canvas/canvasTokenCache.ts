const cache = new Map<
  string,
  { accessToken: string; lastRefreshedAt: number; lifespanMs: number }
>();

export function updateTokenCache(
  refreshToken: string,
  cacheContent: {
    accessToken: string;
    lastRefreshedAt: number;
    lifespanMs: number;
  },
) {
  cache.set(refreshToken, cacheContent);
}

const bufferMs = 1000 * 60 * 5; // 5 minutes

export function getCachedAccessToken(refreshToken: string) {
  const rawCache = cache.get(refreshToken);
  if (!rawCache) {
    return null;
  }
  const timeSinceLastRefresh = Date.now() - rawCache.lastRefreshedAt;
  if (timeSinceLastRefresh > rawCache.lifespanMs - bufferMs) {
    cache.delete(refreshToken);
    return null;
  }
  return rawCache.accessToken;
}
