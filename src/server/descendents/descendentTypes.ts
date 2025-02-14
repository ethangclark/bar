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
  [K in DescendentName]: { [key: string]: Descendents[K][number] };
};
export type DescendentRows = {
  [K in DescendentName]: Descendents[K][number];
};

type DescendentRow = {
  id: string;
  activityId: string;
};

type PermissionParams = {
  userId: string;
  activityId: string;
  enrolledAs: EnrollmentType[];
};

type ActionBaseParams = PermissionParams & {
  tx: DbOrTx;
};

type EditParams<T extends DescendentRow> = ActionBaseParams & {
  rows: T[];
  afterTx: (cb: () => MaybePromise<void>) => void;
};

type CreateParams<T extends DescendentRow> = EditParams<T>;
type ReadParams = ActionBaseParams & {
  includeUserIds: string[];
};
type UpdateParams<T extends DescendentRow> = EditParams<T>;
type DeleteParams = ActionBaseParams & {
  ids: string[];
};

export type DescendentController<T extends DescendentRow> = {
  // important: these methods have not been implemented in the controllers
  // to check that the activityId on the row matches that in the params;
  // the code leveraging controller.canRead and controller.canWrite must
  // implement that check
  canRead(descendent: T, params: PermissionParams): boolean;
  canWrite(descendent: T, params: PermissionParams): boolean;

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
