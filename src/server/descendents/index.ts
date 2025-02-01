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
      rows: descendents.activityItems,
    }),
    evalKeyService.create({
      ...baseParams,
      rows: descendents.evalKeys,
    }),
    questionService.create({
      ...baseParams,
      rows: descendents.questions,
    }),
    infoTextService.create({
      ...baseParams,
      rows: descendents.infoTexts,
    }),
    infoImageService.create({
      ...baseParams,
      rows: descendents.infoImages,
    }),
    threadService.create({
      ...baseParams,
      rows: descendents.threads,
    }),
    messageService.create({
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

  await Promise.all(
    descendentNames.map((descendentName) => {
      switch (descendentName) {
        case "activityItems":
          return activityItemService.delete({
            ...baseParams,
            ids: descendents.activityItems.map((d) => d.id),
          });
        case "evalKeys":
          return evalKeyService.delete({
            ...baseParams,
            ids: descendents.evalKeys.map((d) => d.id),
          });
        case "questions":
          return questionService.delete({
            ...baseParams,
            ids: descendents.questions.map((d) => d.id),
          });
        case "infoTexts":
          return infoTextService.delete({
            ...baseParams,
            ids: descendents.infoTexts.map((d) => d.id),
          });
        case "infoImages":
          return infoImageService.delete({
            ...baseParams,
            ids: descendents.infoImages.map((d) => d.id),
          });
        case "threads":
          return threadService.delete({
            ...baseParams,
            ids: descendents.threads.map((d) => d.id),
          });
        case "messages":
          return messageService.delete({
            ...baseParams,
            ids: descendents.messages.map((d) => d.id),
          });
        default:
          assertNever(descendentName);
      }
    }),
  );
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
