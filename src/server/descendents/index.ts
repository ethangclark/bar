import { type DbOrTx } from "~/server/db";
import { type EnrollmentType } from "~/common/enrollmentTypeUtils";
import { type DescendentModification, type Descendents } from "./types";
import { activityItemService } from "./activityItemController";
import { evalKeyService } from "./evalKeyController";
import { infoImageService } from "./infoImageController";
import { infoTextService } from "./infoTextController";
import { messageService } from "./messageController";
import { questionService } from "./questionController";
import { threadService } from "./threadController";
import { descendentNames } from "~/common/descendentNames";
import { assertNever } from "~/common/errorUtils";
import { objectEntries } from "~/common/objectUtils";
import { clone } from "~/common/cloneUtils";
import { mergeDescendents } from "~/common/descendentUtils";

export async function createDescendents({
  activityId,
  enrolledAs,
  descendents,
  userId,
  tx,
}: {
  activityId: string;
  enrolledAs: EnrollmentType[];
  descendents: Descendents;
  userId: string;
  tx: DbOrTx;
}) {
  const baseParams = {
    userId,
    activityId,
    enrolledAs,
    tx,
  };

  const [
    activityItems,
    evalKeys,
    questions,
    infoTexts,
    infoImages,
    threads,
    messages,
  ] = await Promise.all([
    activityItemService.create({
      ...baseParams,
      rows: Object.values(descendents.activityItems),
    }),
    evalKeyService.create({
      ...baseParams,
      rows: Object.values(descendents.evalKeys),
    }),
    questionService.create({
      ...baseParams,
      rows: Object.values(descendents.questions),
    }),
    infoTextService.create({
      ...baseParams,
      rows: Object.values(descendents.infoTexts),
    }),
    infoImageService.create({
      ...baseParams,
      rows: Object.values(descendents.infoImages),
    }),
    threadService.create({
      ...baseParams,
      rows: Object.values(descendents.threads),
    }),
    messageService.create({
      ...baseParams,
      rows: Object.values(descendents.messages),
    }),
  ]);

  const result: Descendents = {
    activityItems,
    evalKeys,
    questions,
    infoTexts,
    infoImages,
    threads,
    messages,
  };

  return result;
}

export async function readDescendents({
  activityId,
  userId,
  enrolledAs,
  includeUserIds,
  tx,
}: {
  activityId: string;
  userId: string;
  enrolledAs: EnrollmentType[];
  includeUserIds: string[];
  tx: DbOrTx;
}) {
  const params = {
    userId,
    activityId,
    enrolledAs,
    includeUserIds,
    tx,
  };

  const [
    activityItems,
    evalKeys,
    questions,
    infoTexts,
    infoImages,
    threads,
    messages,
  ] = await Promise.all([
    activityItemService.read(params),
    evalKeyService.read(params),
    questionService.read(params),
    infoTextService.read(params),
    infoImageService.read(params),
    threadService.read(params),
    messageService.read(params),
  ]);

  const result: Descendents = {
    activityItems,
    evalKeys,
    questions,
    infoTexts,
    infoImages,
    threads,
    messages,
  };

  return result;
}

export async function updateDescendents({
  activityId,
  descendents,
  userId,
  enrolledAs,
  tx,
}: {
  activityId: string;
  descendents: Descendents;
  userId: string;
  enrolledAs: EnrollmentType[];
  tx: DbOrTx;
}) {
  const baseParams = {
    userId,
    activityId,
    enrolledAs,
    tx,
  };

  const [
    activityItems,
    evalKeys,
    questions,
    infoTexts,
    infoImages,
    threads,
    messages,
  ] = await Promise.all([
    activityItemService.update({
      ...baseParams,
      rows: descendents.activityItems,
    }),
    evalKeyService.update({
      ...baseParams,
      rows: descendents.evalKeys,
    }),
    questionService.update({
      ...baseParams,
      rows: descendents.questions,
    }),
    infoTextService.update({
      ...baseParams,
      rows: descendents.infoTexts,
    }),
    infoImageService.update({
      ...baseParams,
      rows: descendents.infoImages,
    }),
    threadService.update({
      ...baseParams,
      rows: descendents.threads,
    }),
    messageService.update({
      ...baseParams,
      rows: descendents.messages,
    }),
  ]);

  const result: Descendents = {
    activityItems,
    evalKeys,
    questions,
    infoTexts,
    infoImages,
    threads,
    messages,
  };

  return result;
}

export async function deleteDescendents({
  activityId,
  userId,
  enrolledAs,
  descendents,
  tx,
}: {
  activityId: string;
  userId: string;
  enrolledAs: EnrollmentType[];
  descendents: Descendents;
  tx: DbOrTx;
}) {
  const baseParams = {
    userId,
    activityId,
    enrolledAs,
    descendents,
    tx,
  };

  const toAwait = Array<Promise<void>>();

  for (const descendentName of descendentNames) {
    switch (descendentName) {
      case "activityItems":
        toAwait.push(
          activityItemService.delete({
            ...baseParams,
            ids: descendents.activityItems.map((d) => d.id),
          }),
        );
        return true;
      case "evalKeys":
        toAwait.push(
          evalKeyService.delete({
            ...baseParams,
            ids: descendents.evalKeys.map((d) => d.id),
          }),
        );
        return true;
      case "questions":
        toAwait.push(
          questionService.delete({
            ...baseParams,
            ids: descendents.questions.map((d) => d.id),
          }),
        );
        return true;
      case "infoTexts":
        toAwait.push(
          infoTextService.delete({
            ...baseParams,
            ids: descendents.infoTexts.map((d) => d.id),
          }),
        );
        return true;
      case "infoImages":
        toAwait.push(
          infoImageService.delete({
            ...baseParams,
            ids: descendents.infoImages.map((d) => d.id),
          }),
        );
        return true;
      case "threads":
        toAwait.push(
          threadService.delete({
            ...baseParams,
            ids: descendents.threads.map((d) => d.id),
          }),
        );
        return true;
      case "messages":
        toAwait.push(
          messageService.delete({
            ...baseParams,
            ids: descendents.messages.map((d) => d.id),
          }),
        );
        return true;
      default:
        assertNever(descendentName);
    }
  }

  await Promise.all(toAwait);
}

export async function modifyDescendents({
  activityId,
  descendentModification,
  userId,
  enrolledAs,
  tx,
}: {
  activityId: string;
  descendentModification: DescendentModification;
  userId: string;
  enrolledAs: EnrollmentType[];
  tx: DbOrTx;
}) {
  const { toCreate, toUpdate, toDelete } = clone(descendentModification);

  // ensure deleted objects are not included in the toCreate or toUpdate objects
  objectEntries(toDelete).forEach(([descendentName, rows]) => {
    const deleting = new Set(rows.map((d) => d.id));
    [toCreate, toUpdate].forEach((descendents) => {
      descendents[descendentName] = descendents[descendentName].filter(
        (d) => !deleting.has(d.id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any;
    });
  });

  // ensure created objects are not included in the toUpdate object
  objectEntries(toCreate).forEach(([descendentName, descendents]) => {
    const creating = new Set(descendents.map((d) => d.id));
    toUpdate[descendentName] = toUpdate[descendentName].filter(
      (d) => !creating.has(d.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
  });

  const baseParams = {
    userId,
    activityId,
    enrolledAs,
    tx,
  };

  const [created, updated] = await Promise.all([
    createDescendents({
      ...baseParams,
      descendents: toCreate,
    }),
    updateDescendents({
      ...baseParams,
      descendents: toUpdate,
    }),
    deleteDescendents({
      ...baseParams,
      descendents: toDelete,
    }),
  ]);

  const result = mergeDescendents(clone(created), updated);

  return result;
}
