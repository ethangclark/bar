import { z } from "zod";
import * as db from "../../db/schema";
import { objectKeys } from "~/common/utils/objectUtils";
import { PgTableWithColumns } from "drizzle-orm/pg-core";

type Db = typeof db;

const tableSetSchemaInner = {
  activities: z.record(db.activitySchema),
  activityItems: z.record(db.activityItemSchema),
  questions: z.record(db.questionSchema),
  infoTexts: z.record(db.infoTextSchema),
  infoImages: z.record(db.infoImageSchema),
  evalKeys: z.record(db.evalKeySchema),
  threads: z.record(db.threadSchema),
  messages: z.record(db.messageSchema),
} as const satisfies Partial<{
  [K in keyof Db]: Db[K] extends PgTableWithColumns<any> ? any : never;
}>;

export const tableNames = objectKeys(tableSetSchemaInner);
export const tableSetSchema = z.object(tableSetSchemaInner);
export type TableSet = z.infer<typeof tableSetSchema>;
export type TableName = keyof TableSet;
export type TableNameToRow = {
  [K in TableName]: TableSet[K] extends Record<string, infer T> ? T : never;
};

export const modificationOpsSchema = z.object({
  toCreate: tableSetSchema,
  toUpdate: tableSetSchema,
  toDelete: tableSetSchema,
});
export type ModificationOps = z.infer<typeof modificationOpsSchema>;
