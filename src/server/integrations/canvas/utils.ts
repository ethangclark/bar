import { eq } from "drizzle-orm";
import { z } from "zod";
import { type Json } from "~/common/utils/types";
import { db } from "~/server/db";
import { getCachedAccessToken, updateTokenCache } from "./canvasTokenCache";
import { assertError } from "~/common/utils/errorUtils";

export async function getCanvasIntegration(canvasIntegrationId: string) {
  const canvasIntegration = await db.query.canvasIntegrations.findFirst({
    where: eq(db.x.canvasIntegrations.id, canvasIntegrationId),
  });
  if (!canvasIntegration) {
    throw new Error("Canvas integration not found");
  }
  return canvasIntegration;
}

export const narrowedCanvasEnrollmentTypeSchema = z.enum([
  "student",
  "teacher",
  "ta",
  "designer",
  "observer",
]);
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
  urlParams?: Record<string, string | number>;
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

  let accessToken: string | null = null;
  if (refreshToken) {
    accessToken = getCachedAccessToken(refreshToken);
    if (!accessToken) {
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
    }
  }

  try {
    const result = await fetch(url, {
      method,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const asAnyJson = await result.json();
    const asResponseType = responseSchema.parse(asAnyJson);
    return asResponseType;
  } catch (e) {
    assertError(e);
    throw new Error(`Canvas request failed: ${e.message}`);
  }
}
