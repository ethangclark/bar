import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { activityRouter } from "./routers/activityRouter";
import { authRouter } from "./routers/authRouter";
import { canvasRouter } from "./routers/canvasRouter";
import { coursesRouter } from "./routers/coursesRouter";
import { descendentRouter } from "./routers/descendentRouter";
import { integrationRouter } from "./routers/integrationRouter";
import { messageRouter } from "./routers/messageRouter";
import { transcriptionRouter } from "./routers/transcriptionRouter";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  activity: activityRouter,
  descendent: descendentRouter,
  auth: authRouter,
  canvas: canvasRouter,
  courses: coursesRouter,
  integration: integrationRouter,
  message: messageRouter,
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
