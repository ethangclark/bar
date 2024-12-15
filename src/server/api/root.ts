import { postRouter } from "~/server/api/routers/postRouter";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { coursesRouter } from "./routers/coursesRouter";
import { tutoringSessionRouter } from "./routers/tutoringSessionRouter";
import { transcriptionRouter } from "./routers/transcriptionRouter";
import { authRouter } from "./routers/authRouter";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  courses: coursesRouter,
  post: postRouter,
  chat: tutoringSessionRouter,
  trascription: transcriptionRouter,
  tutoringSession: tutoringSessionRouter,
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
