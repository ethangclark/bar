import { eq } from "drizzle-orm";
import { z } from "zod";
import { getRedirectUrl } from "~/common/utils/canvasUtils";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";
import { updateTokenCache } from "./canvasTokenCache";
import { getCanvasIntegration, makeCanvasRequest } from "./utils";

async function getLoginResponse({
  canvasIntegrationId,
  oauthCode,
}: {
  canvasIntegrationId: string;
  oauthCode: string;
}) {
  // not currently using commented-out fields
  const loginResponseSchema = z.object({
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
  });

  const canvasIntegration = await getCanvasIntegration(canvasIntegrationId);

  const raw = await makeCanvasRequest({
    canvasIntegrationId,
    relPath: "/login/oauth2/token",
    method: "POST",
    responseSchema: loginResponseSchema,
    urlParams: {
      code: oauthCode,
      grant_type: "authorization_code",
      client_id: canvasIntegration.clientId,
      client_secret: canvasIntegration.clientSecret,
      redirect_uri: getRedirectUrl(canvasIntegration.canvasBaseUrl),
    },
  });

  return {
    accessToken: raw.access_token,
    lifespanMs: raw.expires_in * 1000,
    refreshToken: raw.refresh_token,
    canvasUser: {
      id: raw.user.id,
      name: raw.user.name,
      globalId: raw.user.global_id,
    },
  };
}

type LoginResponse = Awaited<ReturnType<typeof getLoginResponse>>;

async function upsertUser(
  userId: string,
  canvasIntegrationId: string,
  loginResponse: LoginResponse,
) {
  const { lifespanMs, refreshToken, canvasUser } = loginResponse;

  const existing = await db.query.canvasUsers.findFirst({
    where: eq(dbSchema.canvasUsers.canvasGlobalId, canvasUser.globalId),
  });
  if (existing) {
    const existingNonGlobalIds = z
      .array(z.number())
      .parse(existing.nonGlobalIdsArrJson);
    const nonGlobalIdsArr = [
      ...new Set([...existingNonGlobalIds, canvasUser.id]),
    ];
    await db
      .update(dbSchema.canvasUsers)
      .set({
        nonGlobalIdsArrJson: JSON.stringify(nonGlobalIdsArr),
        canvasUserName: canvasUser.name,
        oauthRefreshToken: refreshToken,
        accessTokenLifespanMs: lifespanMs,
      })
      .where(eq(dbSchema.canvasUsers.canvasGlobalId, canvasUser.globalId));
  } else {
    await db.insert(dbSchema.canvasUsers).values({
      userId,
      canvasIntegrationId,
      canvasGlobalId: canvasUser.globalId,
      nonGlobalIdsArrJson: JSON.stringify([canvasUser.id]),
      canvasUserName: canvasUser.name,
      oauthRefreshToken: refreshToken,
      accessTokenLifespanMs: lifespanMs,
    });
  }
}

export async function executeUserInitiation({
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

  const tBefore = Date.now();

  const loginResponse = await getLoginResponse({
    canvasIntegrationId,
    oauthCode,
  });

  await upsertUser(userId, canvasIntegrationId, loginResponse);

  await db
    .insert(dbSchema.userIntegrations)
    .values({
      userId,
      integrationId: canvasIntegration.integrationId,
    })
    .onConflictDoNothing({
      target: [
        dbSchema.userIntegrations.userId,
        dbSchema.userIntegrations.integrationId,
      ],
    });

  const { refreshToken, accessToken, lifespanMs } = loginResponse;

  updateTokenCache(refreshToken, {
    accessToken,
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

export async function getCanvasCourses({
  userId,
  canvasIntegrationId,
}: {
  userId: string;
  canvasIntegrationId: string;
}) {
  const canvasUsers = await db.query.canvasUsers.findMany({
    where: eq(dbSchema.canvasUsers.userId, userId),
  });
  const courses = Array<{}>();
  for (const canvasUser of canvasUsers) {
    const responseSchema = z.array(
      z.object({
        id: z.number(),
        uuid: z.string(),
        name: z.string(),
        course_code: z.string(),
        workflow_state: z.enum([
          "unpublished",
          "available",
          "completed",
          "deleted",
        ]),
        start_at: z.string().nullable(),
        end_at: z.string().nullable(),
        enrollments: z.array(
          z.object({
            type: z.enum(["StudentEnrollment", "TeacherEnrollment"]),
            role: z.enum(["StudentEnrollment", "TeacherEnrollment"]),
          }),
        ),
        total_students: z.number().nullable().optional(),
      }),
    );
    const coursesResult = await makeCanvasRequest({
      canvasIntegrationId,
      relPath: `/api/v1/courses`,
      method: "GET",
      responseSchema,
      refreshToken: canvasUser.oauthRefreshToken,
    });
    console.log({ coursesResult });
    throw Error("REE");
  }
  return courses;
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
