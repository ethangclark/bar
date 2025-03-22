import { eq, lt, sql } from "drizzle-orm";
import superjson from "superjson";
import { assertOne } from "~/common/assertions";
import { type SuperJsonValue } from "~/common/types";
import { db, schema } from "../db";

export async function cache({
  value,
  durationSeconds,
}: {
  value: SuperJsonValue;
  durationSeconds: number;
}) {
  const values = await db
    .insert(schema.cacheValues)
    .values({
      value: JSON.stringify(value),
      expiresAt: sql`now() + interval '${durationSeconds} seconds'`,
    })
    .returning();
  void db
    .delete(schema.cacheValues)
    .where(lt(schema.cacheValues.expiresAt, sql`now()`));
  return assertOne(values);
}

export async function getCache({
  id,
}: {
  id: string;
}): Promise<SuperJsonValue> {
  const rows = await db
    .select()
    .from(schema.cacheValues)
    .where(eq(schema.cacheValues.id, id));
  const row = assertOne(rows);
  return superjson.parse(row.value);
}
