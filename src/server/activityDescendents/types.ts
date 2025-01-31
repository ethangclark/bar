import { type EnrollmentType } from "~/common/enrollmentTypeUtils";
import { infoTextSchema, messageSchema } from "~/server/db/schema";
import {
  evalKeySchema,
  infoImageSchema,
  questionSchema,
  threadSchema,
} from "~/server/db/schema";
import { z } from "zod";
import { activityItemSchema } from "~/server/db/schema";
import { type DbOrTx } from "../db";
import { type ActivityDescendentName } from "~/common/activityDescendentNames";

export const activityDescendentsSchema = z.object({
  activityItems: z.array(activityItemSchema),
  evalKeys: z.array(evalKeySchema),
  questions: z.array(questionSchema),
  infoTexts: z.array(infoTextSchema),
  infoImages: z.array(infoImageSchema),
  threads: z.array(threadSchema),
  messages: z.array(messageSchema),
}) satisfies z.ZodType<{ [K in ActivityDescendentName]: unknown }>;
export type ActivityDescendents = z.infer<typeof activityDescendentsSchema>;

export type ActivityDescendentTables = {
  [K in ActivityDescendentName]: Record<string, ActivityDescendents[K][number]>;
};

type ActivityDescendentRow = {
  id: string;
  activityId: string;
};

type BaseParams = {
  userId: string;
  activityId: string;
  enrolledAs: EnrollmentType[];
  tx: DbOrTx;
};

type ReadParams = BaseParams & {
  includeUserIds: string[];
};

type EditParams<T extends ActivityDescendentRow> = BaseParams & {
  rows: T[];
};

type DeleteParams = BaseParams & {
  ids: string[];
};

export type ActivityDescendentController<T extends ActivityDescendentRow> = {
  create(params: EditParams<T>): Promise<T[]>;
  read(params: ReadParams): Promise<T[]>;
  update(params: EditParams<T>): Promise<T[]>;
  delete(params: DeleteParams): Promise<void>;
};

export const activityDescendentModificationSchema = z.object({
  toCreate: activityDescendentsSchema,
  toUpdate: activityDescendentsSchema,
  toDelete: activityDescendentsSchema,
});
export type ActivityDescendentModification = z.infer<
  typeof activityDescendentModificationSchema
>;
