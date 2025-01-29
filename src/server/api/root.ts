import { postRouter } from "~/server/api/routers/postRouter";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { coursesRouter } from "./routers/coursesRouter";
import { transcriptionRouter } from "./routers/transcriptionRouter";
import { authRouter } from "./routers/authRouter";
import { canvasRouter } from "./routers/canvasRouter";
import { integrationRouter } from "./routers/integrationRouter";
import { activityRouter } from "./routers/activityRouter";
import { evalKeysRouter } from "./routers/evalKeysRouter";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  activity: activityRouter,
  evalKeys: evalKeysRouter,
  auth: authRouter,
  canvas: canvasRouter,
  courses: coursesRouter,
  integration: integrationRouter,
  post: postRouter,
  trascription: transcriptionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
