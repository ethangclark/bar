import { z } from "zod";
import { pageLoadedClassname } from "~/common/utils/constants";
import { db } from "~/server/db";
import { PageWithAnnotation } from "./_pageWithAnnotation";

const PngPage = async (props: unknown) => {
  const pngUuid = z
    .object({
      params: z.object({
        pngUuid: z.string(),
      }),
    })
    .parse(props).params.pngUuid;

  if (!z.string().uuid().safeParse(pngUuid).success) {
    return <div>Invalid UUID</div>;
  }

  const png = await db.query.pngs.findFirst({
    where: (pngs, { eq }) => eq(pngs.uuid, pngUuid),
  });

  if (!png) {
    return <div>Not found</div>;
  }

  return (
    <div className={pageLoadedClassname}>
      <PageWithAnnotation imageDataUrl={png.asUrl} />
    </div>
  );
};

export default PngPage;
