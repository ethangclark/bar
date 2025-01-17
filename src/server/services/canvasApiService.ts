import { eq } from "drizzle-orm";
import { z } from "zod";
import { getRedirectUrl } from "~/common/utils/canvasUtils";
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
  oauthCode,
  canvasIntegrationId,
}: {
  userId: string;
  oauthCode: string;
  canvasIntegrationId: string;
}) {
  const canvasIntegration = await db.query.canvasIntegrations.findFirst({
    where: eq(dbSchema.canvasIntegrations.id, canvasIntegrationId),
  });
  if (!canvasIntegration) {
    throw new Error("Canvas integration not found");
  }

  const params = new URLSearchParams();
  params.append("code", oauthCode);
  params.append("grant_type", "authorization_code");
  params.append("client_id", canvasIntegration.clientId);
  params.append("client_secret", canvasIntegration.clientSecret);
  params.append(
    "redirect_uri",
    getRedirectUrl(canvasIntegration.canvasBaseUrl),
  );

  const tBefore = Date.now();
  const result = await fetch(
    `${canvasIntegration.canvasBaseUrl}/login/oauth2/token?${params.toString()}`,
    {
      method: "POST",
    },
  );
  const asJson = await result.json();

  // not currently using commented-out fields
  const typed = z
    .object({
      access_token: z.string(),
      // canvas_region: z.string(),
      expires_in: z.number(), // time in seconds
      refresh_token: z.string(),
      // token_type: z.literal("Bearer"),
      user: z.object({
        id: z.number(),
        name: z.string(),
        global_id: z.string(),
        // effective_locale: z.string(),
      }),
    })
    .parse(asJson);

  const lifespanMs = typed.expires_in * 1000;

  const existing = await db.query.canvasUsers.findFirst({
    where: eq(dbSchema.canvasUsers.canvasGlobalId, typed.user.global_id),
  });
  if (existing) {
    const existingNonGlobalIds = z
      .array(z.number())
      .parse(existing.nonGlobalIdsArrJson);
    const nonGlobalIdsArr = [
      ...new Set([...existingNonGlobalIds, typed.user.id]),
    ];
    await db
      .update(dbSchema.canvasUsers)
      .set({
        nonGlobalIdsArrJson: JSON.stringify(nonGlobalIdsArr),
        canvasUserName: typed.user.name,
        oauthRefreshToken: typed.refresh_token,
        accessTokenLifespanMs: lifespanMs,
      })
      .where(eq(dbSchema.canvasUsers.canvasGlobalId, typed.user.global_id));
  } else {
    await db.insert(dbSchema.canvasUsers).values({
      userId,
      canvasIntegrationId: canvasIntegration.id,
      canvasGlobalId: typed.user.global_id,
      nonGlobalIdsArrJson: JSON.stringify([typed.user.id]),
      canvasUserName: typed.user.name,
      oauthRefreshToken: typed.refresh_token,
      accessTokenLifespanMs: lifespanMs,
    });
  }

  updateTokenCache(typed.refresh_token, {
    accessToken: typed.access_token,
    lastRefreshedAt: tBefore,
    lifespanMs,
  });

  // const enrollmentsResult = await fetch(
  //   `${canvasBaseUrl}/api/v1/users/${typed.user.id}/enrollments`,
  //   {
  //     headers: {
  //       Authorization: `Bearer ${typed.access_token}`,
  //     },
  //   },
  // );
  // const asJson2 = await enrollmentsResult.json();
  // console.log(asJson2);
}
