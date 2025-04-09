import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { activityRouter } from "./routers/activityRouter";
import { adminRouter } from "./routers/adminRouter";
import { authRouter } from "./routers/authRouter";
import { canvasRouter } from "./routers/canvasRouter";
import { coursesRouter } from "./routers/coursesRouter";
import { descendentRouter } from "./routers/descendentRouter";
import { errorRouter } from "./routers/errorRouter";
import { imageDescriptionRouter } from "./routers/imageDescriptionRouter";
import { integrationRouter } from "./routers/integrationRouter";
import { messageRouter } from "./routers/messageRouter";
import { submissionRouter } from "./routers/submissionRouter";
import { threadWrapRouter } from "./routers/threadWrapRouter";
import { transcriptionRouter } from "./routers/transcriptionRouter";
import { videoRouter } from "./routers/videoRouter";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  activity: activityRouter,
  auth: authRouter,
  canvas: canvasRouter,
  courses: coursesRouter,
  descendent: descendentRouter,
  error: errorRouter,
  imageDescription: imageDescriptionRouter,
  integration: integrationRouter,
  message: messageRouter,
  transcription: transcriptionRouter,
  threadWrap: threadWrapRouter,
  submission: submissionRouter,
  admin: adminRouter,
  video: videoRouter,
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
