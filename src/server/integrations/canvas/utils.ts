import { eq } from "drizzle-orm";
import { z } from "zod";
import { enrollmentTypeSchema } from "~/common/enrollmentTypeUtils";
import { assertError } from "~/common/errorUtils";
import { type Json } from "~/common/types";
import { db, schema } from "~/server/db";
import { getCachedAccessToken, updateTokenCache } from "./canvasTokenCache";

export async function getCanvasIntegration(canvasIntegrationId: string) {
  const canvasIntegration = await db.query.canvasIntegrations.findFirst({
    where: eq(schema.canvasIntegrations.id, canvasIntegrationId),
  });
  if (!canvasIntegration) {
    throw new Error("Canvas integration not found");
  }
  return canvasIntegration;
}

export const narrowedCanvasEnrollmentTypeSchema = enrollmentTypeSchema;
export type NarrowedCanvasEnrollmentType = z.infer<
  typeof narrowedCanvasEnrollmentTypeSchema
>;
export const otherFormatCanvasEnrollmentTypeSchema = z.enum([
  "StudentEnrollment",
  "TeacherEnrollment",
  "TaEnrollment",
  "DesignerEnrollment",
  "ObserverEnrollment",
]);
export type OtherFormatCanvasEnrollmentType = z.infer<
  typeof otherFormatCanvasEnrollmentTypeSchema
>;
// using this out of paranoia because docs are insonsistent internally +
// with values I'm seeing in empirical local testing
// https://canvas.instructure.com/doc/api/enrollments.html#Enrollment (also see "Courses" section)
export const ambiguousEnrollmentTypeSchema = z.union([
  narrowedCanvasEnrollmentTypeSchema,
  otherFormatCanvasEnrollmentTypeSchema,
]);
export type AmbiguousEnrollmentType = z.infer<
  typeof ambiguousEnrollmentTypeSchema
>;
export function narrowCanvasEnrollmentType(
  enrollmentType: AmbiguousEnrollmentType,
): NarrowedCanvasEnrollmentType {
  switch (enrollmentType) {
    case "StudentEnrollment":
      return "student";
    case "TeacherEnrollment":
      return "teacher";
    case "TaEnrollment":
      return "ta";
    case "DesignerEnrollment":
      return "designer";
    case "ObserverEnrollment":
      return "observer";
    default:
      return enrollmentType;
  }
}

export async function makeCanvasRequest<T extends Json>({
  canvasIntegrationId,
  relPath,
  method,
  responseSchema,
  urlParams,
  refreshToken,
}: {
  canvasIntegrationId: string;
  relPath: `/${string}`;
  method: "GET" | "POST";
  responseSchema: z.ZodType<T>;
  urlParams?: { [key: string]: string | number };
  refreshToken?: string;
}): Promise<T> {
  const canvasIntegration = await getCanvasIntegration(canvasIntegrationId);
  let url = `${canvasIntegration.canvasBaseUrl}${relPath}`;
  if (urlParams) {
    const params = new URLSearchParams();
    Object.entries(urlParams).forEach(([key, value]) => {
      params.append(key, value.toString());
    });
    url += `?${params.toString()}`;
  }

  // TODO: clean this up
  let accessToken: string | null = null;
  if (refreshToken) {
    accessToken = getCachedAccessToken(refreshToken);
    if (!accessToken) {
      const lockName = `canvas_access_token_${canvasIntegrationId}`;
      const startTime = Date.now();
      const maxDurationMs = 1000 * 30;
      let [lock] = await db
        .insert(schema.locks)
        .values({ name: lockName, maxDurationMs })
        .onConflictDoNothing()
        .returning();
      try {
        if (lock) {
          const accessTokenResp = await makeCanvasRequest({
            canvasIntegrationId,
            relPath: "/login/oauth2/token",
            method: "POST",
            responseSchema: z.object({
              access_token: z.string(),
              expires_in: z.number(),
            }),
            urlParams: {
              grant_type: "refresh_token",
              client_id: canvasIntegration.clientId,
              client_secret: canvasIntegration.clientSecret,
              refresh_token: refreshToken,
            },
          });
          updateTokenCache(refreshToken, {
            accessToken: accessTokenResp.access_token,
            lastRefreshedAt: Date.now(),
            lifespanMs: accessTokenResp.expires_in * 1000,
          });
          accessToken = accessTokenResp.access_token;
        } else {
          // wait for the lock to be released
          do {
            await new Promise((resolve) => setTimeout(resolve, 100));
            lock = await db.query.locks.findFirst({
              where: eq(schema.locks.name, lockName),
            });
          } while (lock && Date.now() < startTime + lock.maxDurationMs);
          accessToken = getCachedAccessToken(refreshToken);
          if (!accessToken) {
            throw new Error("Failed to refresh canvas access token");
          }
        }
      } finally {
        await db.delete(schema.locks).where(eq(schema.locks.name, lockName));
      }
    }
  }

  try {
    const authToken = accessToken ? `Bearer ${accessToken}` : null;
    const result = await fetch(url, {
      method,
      headers: authToken ? { Authorization: authToken } : {},
    });
    const asAnyJson = await result.json();
    try {
      const asResponseType = responseSchema.parse(asAnyJson);
      return asResponseType;
    } catch (e) {
      console.error("canvas response error", {
        request: {
          url,
          method,
          authToken,
        },
        response: {
          status: result.status,
          statusText: result.statusText,
          json: asAnyJson,
        },
      });
      throw e;
    }
  } catch (e) {
    assertError(e);
    throw new Error(`Canvas request failed: ${e.message}`);
  }
}
