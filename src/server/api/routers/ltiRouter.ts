import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";

export const ltiRouter = createTRPCRouter({
  selfOnboard: publicProcedure
    .input(
      z.object({
        institutionName: z.string(),
        issuer: z.string(),
        clientId: z.string(),
        deploymentId: z.string(),
        authEndpoint: z.string(),
        jwksUrl: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const {
        institutionName,
        issuer,
        clientId,
        deploymentId,
        authEndpoint,
        jwksUrl,
      } = input;
      await db.insert(dbSchema.institutions).values({
        name: institutionName,
        issuer,
        clientId,
        deploymentId,
        authEndpoint,
        jwksUrl,
      });
    }),
  initOidc: publicProcedure
    .input(
      z.object({
        iss: z.string(),
        login_hint: z.string(),
        lti_message_hint: z.string().nullable().optional(),
        lti_deployment_id: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { iss, login_hint, lti_message_hint, lti_deployment_id } = input;

      // We’d look up the LMS config from DB by `iss`:
      // e.g. const row = await db.query('SELECT * FROM institutions WHERE issuer = ...')
      // Hardcoding for demonstration:
      const clientId = "12345";
      const authEndpoint = "https://example-lms.com/auth";
      const redirectUri = "http://localhost:3000/lti/launch";

      // Generate state & nonce for OIDC
      const state = Math.random().toString(36).substring(7);
      const nonce = Math.random().toString(36).substring(7);

      // Save state & nonce in ephemeral cache so we can validate them later.
      // OIDC_STATE_CACHE.set(state, { iss, clientId, lti_deployment_id, nonce });
      if (1) {
        throw new Error(
          "NOT YET IMPLEMENTED; check out the above code in the readme",
        );
      }

      // Build the redirect URL to the LMS’s auth endpoint:
      const params = new URLSearchParams({
        response_type: "id_token",
        scope: "openid",
        client_id: clientId,
        redirect_uri: redirectUri,
        login_hint,
        state,
        nonce,
      });
      // If we have lti_message_hint or lti_deployment_id, we can pass them too:
      if (lti_message_hint) params.set("lti_message_hint", lti_message_hint);
      if (lti_deployment_id) params.set("lti_deployment_id", lti_deployment_id);

      const redirectUrl = `${authEndpoint}?${params.toString()}`;

      return { redirectUrl };
    }),
  assignments: publicProcedure.query(async () => {
    return await db.query.assignments.findMany();
  }),
  createAssignment: publicProcedure
    .input(
      z.object({
        title: z.string(),
        maxScore: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { title, maxScore } = input;
      await db.insert(dbSchema.assignments).values({
        title,
        maxScore,
      });
    }),
});
