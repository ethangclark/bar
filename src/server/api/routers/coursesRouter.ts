import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { type LmsCourse } from "~/server/integrations/utils/integrationApi";
import { getIntegrationApis } from "~/server/services/integrationService";

export const coursesRouter = createTRPCRouter({
  courses: publicProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;
    const integrationsApis = await getIntegrationApis(userId);
    const courses = Array<LmsCourse>();
    await Promise.all(
      integrationsApis.map(async (integrationApi) => {
        const cs = await integrationApi.getActivities({ userId });
        courses.push(...cs);
      }),
    );
    return courses;
  }),
});
