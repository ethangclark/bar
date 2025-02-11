import { type EnrollmentType } from "~/common/enrollmentTypeUtils";
import { infoTextSchema, messageSchema } from "~/server/db/schema";
import {
  evalKeySchema,
  infoImageSchema,
  questionSchema,
  threadSchema,
} from "~/server/db/schema";
import { z } from "zod";
import { itemSchema } from "~/server/db/schema";
import { type DbOrTx } from "../db";
import { type DescendentName } from "~/common/descendentNames";
import { type MaybePromise } from "~/common/types";

export const descendentsSchema = z.object({
  items: z.array(itemSchema),
  evalKeys: z.array(evalKeySchema),
  questions: z.array(questionSchema),
  infoTexts: z.array(infoTextSchema),
  infoImages: z.array(infoImageSchema),
  threads: z.array(threadSchema),
  messages: z.array(messageSchema),
}) satisfies z.ZodType<{ [K in DescendentName]: unknown }>;
export type Descendents = z.infer<typeof descendentsSchema>;

export type DescendentTables = {
  [K in DescendentName]: Record<string, Descendents[K][number]>;
};
export type DescendentRows = {
  [K in DescendentName]: Descendents[K][number];
};

type DescendentRow = {
  id: string;
  activityId: string;
};

type BaseParams = {
  userId: string;
  activityId: string;
  enrolledAs: EnrollmentType[];
  tx: DbOrTx;
};

type EditParams<T extends DescendentRow> = BaseParams & {
  rows: T[];
  afterTx: (cb: () => MaybePromise<void>) => void;
};

type CreateParams<T extends DescendentRow> = EditParams<T>;
type ReadParams = BaseParams & {
  includeUserIds: string[];
};
type UpdateParams<T extends DescendentRow> = EditParams<T>;
type DeleteParams = BaseParams & {
  ids: string[];
};

export type DescendentController<T extends DescendentRow> = {
  create(params: CreateParams<T>): Promise<T[]>;
  read(params: ReadParams): Promise<T[]>;
  update(params: UpdateParams<T>): Promise<T[]>;
  delete(params: DeleteParams): Promise<void>;
};

export const modificationsSchema = z.object({
  toCreate: descendentsSchema,
  toUpdate: descendentsSchema,
  toDelete: descendentsSchema,
});
export type Modifications = z.infer<typeof modificationsSchema>;

export type AfterTx = (cb: () => MaybePromise<void>) => void;
