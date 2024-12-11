import { postRouter } from "~/server/api/routers/postRouter";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { courseRouter } from "./routers/courseRouter";
import { tutoringSessionRouter } from "./routers/tutoringSessionRouter";
import { transcriptionRouter } from "./routers/transcriptionRouter";
import { authRouter } from "./routers/authRouter";
import { variantRouter } from "./routers/variantRouter";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  course: courseRouter,
  post: postRouter,
  chat: tutoringSessionRouter,
  trascription: transcriptionRouter,
  tutoringSession: tutoringSessionRouter,
  variants: variantRouter,
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
