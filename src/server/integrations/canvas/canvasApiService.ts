import { eq } from "drizzle-orm";
import { z } from "zod";
import { getRedirectUrl } from "~/common/canvasUtils";
import { db, type DbOrTx } from "~/server/db";
import { updateTokenCache } from "./canvasTokenCache";
import {
  ambiguousEnrollmentTypeSchema,
  getCanvasIntegration,
  makeCanvasRequest,
  narrowCanvasEnrollmentType,
} from "./utils";
import { parseDateOrNull } from "~/common/timeUtils";

/*
This file is a mess.
We should be returning `null` or empty arrays if objects aren't found,
and only throwing errors if there's an error in connecting with the system
or someone's trying to access something they shouldn't.
*/

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
    where: eq(db.x.canvasUsers.canvasGlobalId, canvasUser.globalId),
  });
  if (existing) {
    const existingNonGlobalIds = z
      .array(z.number())
      .parse(existing.nonGlobalIdsArrJson);
    const nonGlobalIdsArr = [
      ...new Set([...existingNonGlobalIds, canvasUser.id]),
    ];
    await tx
      .update(db.x.canvasUsers)
      .set({
        nonGlobalIdsArrJson: JSON.stringify(nonGlobalIdsArr),
        canvasUserName: canvasUser.name,
        oauthRefreshToken: refreshToken,
        accessTokenLifespanMs: lifespanMs,
      })
      .where(eq(db.x.canvasUsers.canvasGlobalId, canvasUser.globalId));
  } else {
    await tx.insert(db.x.canvasUsers).values({
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
    where: eq(db.x.canvasIntegrations.id, canvasIntegrationId),
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
    .insert(db.x.userIntegrations)
    .values({
      userId,
      integrationId: canvasIntegration.integrationId,
    })
    .onConflictDoNothing({
      target: [
        db.x.userIntegrations.userId,
        db.x.userIntegrations.integrationId,
      ],
    });

  const { refreshToken, accessToken, lifespanMs } = loginResponse;

  updateTokenCache(refreshToken, {
    accessToken,
    lastRefreshedAt: tBefore,
    lifespanMs,
  });
}

const canvasCourseResponseSchema = z.object({
  id: z.number(),
  // uuid: z.string(),
  name: z.string(),
  course_code: z.string(),
  workflow_state: z.enum(["unpublished", "available", "completed", "deleted"]),
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

const formatCourse = (rc: z.infer<typeof canvasCourseResponseSchema>) => ({
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
});

export type CanvasCourse = ReturnType<typeof formatCourse>;

export async function getCanvasCourse({
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
    where: eq(db.x.canvasUsers.userId, userId),
  });
  const rawCourses = Array<z.infer<typeof canvasCourseResponseSchema>>();
  for (const canvasUser of canvasUsers) {
    const courseResult = await makeCanvasRequest({
      canvasIntegrationId,
      relPath: `/api/v1/courses/${canvasCourseId}`,
      method: "GET",
      responseSchema: canvasCourseResponseSchema,
      refreshToken: canvasUser.oauthRefreshToken,
    });
    rawCourses.push(courseResult);
  }
  const [rawCourse, ...rest] = rawCourses;
  if (!rawCourse) {
    throw new Error("Course not found in Canvas");
  }
  if (rest.length > 0) {
    throw new Error("More than one course found in Canvas");
  }
  return formatCourse(rawCourse);
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
    where: eq(db.x.canvasUsers.userId, userId),
  });
  const rawCourses = Array<z.infer<typeof canvasCourseResponseSchema>>();
  for (const canvasUser of canvasUsers) {
    const responseSchema = z.array(canvasCourseResponseSchema);
    const coursesResult = await makeCanvasRequest({
      canvasIntegrationId,
      relPath: `/api/v1/courses`,
      method: "GET",
      responseSchema,
      refreshToken: canvasUser.oauthRefreshToken,
    });
    rawCourses.push(...coursesResult);
  }
  return rawCourses.map(formatCourse);
}

const canvasAssignmentResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  due_at: z.string().nullable(),
  lock_at: z.string().nullable(),
  points_possible: z.number().nullable(),
  grading_type: z.enum([
    "gpa_scale",
    "letter_grade",
    "pass_fail",
    "percent",
    "points",
  ]),
});

const formatAssignment = (
  ra: z.infer<typeof canvasAssignmentResponseSchema>,
) => ({
  id: ra.id,
  name: ra.name,
  dueAt: parseDateOrNull(ra.due_at),
  lockedAt: parseDateOrNull(ra.lock_at),
  pointsPossible: ra.points_possible,
  gradingType: ra.grading_type,
});

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
    where: eq(db.x.canvasUsers.userId, userId),
  });
  const rawAssignments =
    Array<z.infer<typeof canvasAssignmentResponseSchema>>();
  for (const canvasUser of canvasUsers) {
    const responseSchema = z.array(canvasAssignmentResponseSchema);
    const assignmentsResult = await makeCanvasRequest({
      canvasIntegrationId,
      relPath: `/api/v1/users/${canvasUser.canvasGlobalId}/courses/${canvasCourseId}/assignments`,
      method: "GET",
      responseSchema,
      refreshToken: canvasUser.oauthRefreshToken,
    });
    rawAssignments.push(...assignmentsResult);
  }
  return rawAssignments.map(formatAssignment);
}
