import { eq } from "drizzle-orm";
import { ShouldNeverHappen } from "~/common/utils/errorUtils";
import { pngBufferToUrl } from "~/common/utils/pngUtils";
import { db } from "~/server/db";
import { dbSchema } from "../db/dbSchema";
import { type Result, failure } from "~/common/utils/result";
import { env } from "~/env";

export async function withPersistedPng<T>(
  pngBuffer: Buffer,
  cb: (pngUuid: string) => Promise<T>,
): Promise<T> {
  const [png] = await db
    .insert(dbSchema.pngs)
    .values({ asUrl: pngBufferToUrl(pngBuffer) })
    .returning();
  if (!png) {
    throw new ShouldNeverHappen();
  }

  const result = await cb(png.uuid);

  try {
    return result;
  } finally {
    if (env.NODE_ENV === "production") {
      await db.delete(dbSchema.pngs).where(eq(dbSchema.pngs.uuid, png.uuid));
    }
  }
}

export async function getPersistedPngUrl(
  pngUuid: string,
): Promise<Result<string>> {
  const png = await db.query.pngs.findFirst({
    where: eq(dbSchema.pngs.uuid, pngUuid),
  });
  if (!png) {
    return failure("No persisted PNG with given uuid was found.");
  }
  return png.asUrl;
}
