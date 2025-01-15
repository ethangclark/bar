import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";

const cache = new Map<
  string,
  { accessToken: string; lastRefreshedAt: number }
>();

function updateTokenCache(
  refreshToken: string,
  cacheContent: {
    accessToken: string;
    lastRefreshedAt: number;
    lifespanMs: number;
  },
) {
  cache.set(refreshToken, cacheContent);
}

export async function createCanvasUser({
  userId,
  oauthRefreshToken,
  oauthAccessToken,
  timestampBeforeCreation,
  accessTokenLifespanMs,
}: {
  userId: string;
  oauthRefreshToken: string;
  oauthAccessToken: string;
  timestampBeforeCreation: number;
  accessTokenLifespanMs: number;
}) {
  await db.insert(dbSchema.canvasUsers).values({
    userId,
    oauthRefreshToken,
    accessTokenLifespanMs,
  });

  updateTokenCache(oauthRefreshToken, {
    accessToken: oauthAccessToken,
    lastRefreshedAt: timestampBeforeCreation,
    lifespanMs: accessTokenLifespanMs,
  });
}
