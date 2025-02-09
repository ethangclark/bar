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

import { getServerAuthSession } from "~/server/auth/auth";
import { db } from "~/server/db";
import { ipUsers, users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { queryUser } from "~/server/services/userService";
import { getLoginInfo } from "~/server/services/authService";

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
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const ipAddressHeader = opts.headers.get("x-forwarded-for") ?? "";
  const ipAddress = ipAddressHeader.split(",")[0];
  if (!ipAddress) throw new Error("IP address not found");

  const session = await getServerAuthSession();

  const user = await db.transaction(async (tx) => {
    if (session?.user) {
      const u = await queryUser(session.user.id, tx);
      if (!u) throw new Error("Session user not found");
      return u;
    }

    const ipUser = await tx.query.ipUsers.findFirst({
      where: eq(ipUsers.ipAddress, ipAddress),
      with: { user: true },
    });
    if (ipUser) {
      return ipUser.user;
    }
    // create a new user automatically
    const [u] = await tx.insert(users).values({ email: "" }).returning();
    if (!u)
      throw new Error(
        "User (ip addr only) created via create statement not found",
      );

    await tx.insert(ipUsers).values({
      ipAddress,
      userId: u.id,
    });
    return u;
  });

  return {
    ipAddress,
    userId: user.id,
    session,
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

// Throws if user is not logged in
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const { user, isLoggedIn } = await getLoginInfo(ctx.userId, ctx.session);
  if (!isLoggedIn) {
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
