import { eq } from "drizzle-orm";
import { z } from "zod";
import { getRedirectUrl } from "~/common/utils/canvasUtils";
import { type DbOrTx } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";
import { updateTokenCache } from "./canvasTokenCache";
import {
  ambiguousEnrollmentTypeSchema,
  getCanvasIntegration,
  makeCanvasRequest,
  narrowCanvasEnrollmentType,
} from "./utils";

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
  tx: DbOrTx,
) {
  const { lifespanMs, refreshToken, canvasUser } = loginResponse;

  const existing = await tx.query.canvasUsers.findFirst({
    where: eq(dbSchema.canvasUsers.canvasGlobalId, canvasUser.globalId),
  });
  if (existing) {
    const existingNonGlobalIds = z
      .array(z.number())
      .parse(existing.nonGlobalIdsArrJson);
    const nonGlobalIdsArr = [
      ...new Set([...existingNonGlobalIds, canvasUser.id]),
    ];
    await tx
      .update(dbSchema.canvasUsers)
      .set({
        nonGlobalIdsArrJson: JSON.stringify(nonGlobalIdsArr),
        canvasUserName: canvasUser.name,
        oauthRefreshToken: refreshToken,
        accessTokenLifespanMs: lifespanMs,
      })
      .where(eq(dbSchema.canvasUsers.canvasGlobalId, canvasUser.globalId));
  } else {
    await tx.insert(dbSchema.canvasUsers).values({
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
  tx,
}: {
  userId: string;
  oauthCode: string;
  canvasIntegrationId: string;
  tx: DbOrTx;
}) {
  const canvasIntegration = await tx.query.canvasIntegrations.findFirst({
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

  await upsertUser(userId, canvasIntegrationId, loginResponse, tx);

  await tx
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
}

export async function getCanvasCourses({
  userId,
  canvasIntegrationId,
  tx,
}: {
  userId: string;
  canvasIntegrationId: string;
  tx: DbOrTx;
}) {
  const canvasUsers = await tx.query.canvasUsers.findMany({
    where: eq(dbSchema.canvasUsers.userId, userId),
  });
  const courseSchema = z.object({
    id: z.number(),
    // uuid: z.string(),
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
        type: ambiguousEnrollmentTypeSchema,
        enrollment_state: z.enum([
          "active",
          "invited",
          "creation_pending",
          "deleted",
          "inactive",
        ]),
      }),
    ),
    total_students: z.number().nullable().optional(),
  });
  const rawCourses = Array<z.infer<typeof courseSchema>>();
  for (const canvasUser of canvasUsers) {
    const responseSchema = z.array(courseSchema);
    const coursesResult = await makeCanvasRequest({
      canvasIntegrationId,
      relPath: `/api/v1/courses`,
      method: "GET",
      responseSchema,
      refreshToken: canvasUser.oauthRefreshToken,
    });
    rawCourses.push(...coursesResult);
  }
  return rawCourses.map((rc) => ({
    id: rc.id,
    name: rc.name,
    courseCode: rc.course_code,
    workflowState: rc.workflow_state,
    startAt: rc.start_at,
    endAt: rc.end_at,
    enrollments: rc.enrollments.map((e) => ({
      type: narrowCanvasEnrollmentType(e.type),
      enrollmentState: e.enrollment_state,
      enrolledAs: narrowCanvasEnrollmentType(e.type),
    })),
    totalStudents: rc.total_students,
  }));
}

export async function getCanvasAssignments({
  userId,
  canvasIntegrationId,
  canvasCourseId,
  tx,
}: {
  userId: string;
  canvasIntegrationId: string;
  canvasCourseId: number;
  tx: DbOrTx;
}) {
  const canvasUsers = await tx.query.canvasUsers.findMany({
    where: eq(dbSchema.canvasUsers.userId, userId),
  });
  const assignmentSchema = z.object({
    id: z.number(),
    name: z.string(),
    due_at: z.string().nullable(),
    points_possible: z.number().nullable(),
    grading_type: z.enum([
      "gpa_scale",
      "letter_grade",
      "pass_fail",
      "percent",
      "points",
    ]),
  });
  const rawAssignments = Array<z.infer<typeof assignmentSchema>>();
  for (const canvasUser of canvasUsers) {
    const responseSchema = z.array(assignmentSchema);
    const assignmentsResult = await makeCanvasRequest({
      canvasIntegrationId,
      relPath: `/api/v1/users/${canvasUser.canvasGlobalId}/courses/${canvasCourseId}/assignments`,
      method: "GET",
      responseSchema,
      refreshToken: canvasUser.oauthRefreshToken,
    });
    rawAssignments.push(...assignmentsResult);
  }
  return rawAssignments.map((ra) => ({
    id: ra.id,
    name: ra.name,
    dueAt: ra.due_at,
    pointsPossible: ra.points_possible,
    gradingType: ra.grading_type,
  }));
}
