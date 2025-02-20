import { z } from "zod";
import { type DescendentName } from "~/common/descendentNames";
import { type EnrollmentType } from "~/common/enrollmentTypeUtils";
import { type MaybePromise } from "~/common/types";
import {
  evalKeySchema,
  infoImageSchema,
  infoTextSchema,
  itemSchema,
  messageSchema,
  questionSchema,
  threadSchema,
  viewPieceImagesSchema,
  viewPieceSchema,
  viewPieceTextSchema,
} from "~/server/db/schema";
import { type DbOrTx } from "../db";

export const descendentsSchema = z.object({
  items: z.array(itemSchema),
  evalKeys: z.array(evalKeySchema),
  questions: z.array(questionSchema),
  infoTexts: z.array(infoTextSchema),
  infoImages: z.array(infoImageSchema),
  threads: z.array(threadSchema),
  messages: z.array(messageSchema),
  viewPieces: z.array(viewPieceSchema),
  viewPieceImages: z.array(viewPieceImagesSchema),
  viewPieceTexts: z.array(viewPieceTextSchema),
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
  enqueueSideEffect: (cb: () => MaybePromise<void>) => void;
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
  // important: this method has not been implemented in the controllers
  // to check that the activityId on the row matches that in the params;
  // the code leveraging controller.canRead must implement that check
  canRead(descendent: T, params: PermissionParams): boolean;

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
