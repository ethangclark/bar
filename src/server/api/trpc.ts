/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { eq } from "drizzle-orm";
import { assertOneOrNone } from "~/common/assertions";
import { db, schema } from "~/server/db";
import { queryUser } from "~/server/services/userService";
import { notifyAdmin } from "../services/email/notifyAdmin";
import { getIpAddress } from "../utils";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: {
  headers: Headers;
  sessionCookieValue: string | null;
}) => {
  const ipAddress = getIpAddress((headerName) => opts.headers.get(headerName));

  const sessions = await db
    .insert(schema.sessions)
    .values({
      sessionCookieValue: opts.sessionCookieValue ?? crypto.randomUUID(),
      lastIpAddress: ipAddress,
    })
    .onConflictDoUpdate({
      target: [schema.sessions.sessionCookieValue],
      set: {
        // doing an update here allows us to always return a value --
        // tracking the IP is more of an excuse to do this than anything
        lastIpAddress: ipAddress,
      },
    })
    .returning();
  const session = assertOneOrNone(sessions);

  const user =
    (await db.query.users.findFirst({
      where: eq(schema.users.id, session?.userId ?? crypto.randomUUID()),
    })) ?? null;

  return {
    ipAddress,
    session,
    user,
    userId: user?.id ?? null,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

type QueryCb = Parameters<typeof publicProcedure.query>[0];
type QueryArgCtx = Parameters<QueryCb>[0]["ctx"];

export function isLoggedIn(ctx: QueryArgCtx) {
  return !!ctx.session?.userId;
}

// Throws if user is not logged in
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const { session, user, userId } = ctx;
  if (!session || !user || !userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (!isLoggedIn(ctx)) {
    await notifyAdmin("isLoggedIn logic is not working as expected", {
      session,
      user,
      userId,
    });
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,

      // infers fields as non-nullable
      session,
      user,
      userId,
    },
  });
});

export const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const user = await queryUser(ctx.userId, db);
  if (user?.email !== "ethangclark@gmail.com") {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      // infers the `session` as non-nullable
      session: { ...ctx.session, user },
    },
  });
});
