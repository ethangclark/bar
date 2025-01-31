import { type DbOrTx } from "~/server/db";
import { type EnrollmentType } from "~/common/enrollmentTypeUtils";
import {
  type ActivityDescendentModification,
  type ActivityDescendentIds,
  type ActivityDescendents,
} from "./types";
import { activityItemService } from "./activityItemController";
import { evalKeyService } from "./evalKeyController";
import { infoImageService } from "./infoImageController";
import { infoTextService } from "./infoTextController";
import { messageService } from "./messageController";
import { questionService } from "./questionController";
import { threadService } from "./threadController";
import { activityDescendentNames } from "~/common/activityDescendentUtils";
import { assertNever } from "~/common/errorUtils";
import { objectEntries } from "~/common/objectUtils";
import { clone } from "~/common/cloneUtils";

export async function createActivityDescendents({
  activityId,
  enrolledAs,
  activityDescendents,
  userId,
  tx,
}: {
  activityId: string;
  enrolledAs: EnrollmentType[];
  activityDescendents: ActivityDescendents;
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
      rows: activityDescendents.activityItems,
    }),
    evalKeyService.create({
      ...baseParams,
      rows: activityDescendents.evalKeys,
    }),
    questionService.create({
      ...baseParams,
      rows: activityDescendents.questions,
    }),
    infoTextService.create({
      ...baseParams,
      rows: activityDescendents.infoTexts,
    }),
    infoImageService.create({
      ...baseParams,
      rows: activityDescendents.infoImages,
    }),
    threadService.create({
      ...baseParams,
      rows: activityDescendents.threads,
    }),
    messageService.create({
      ...baseParams,
      rows: activityDescendents.messages,
    }),
  ]);

  const result: ActivityDescendents = {
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

export async function readActivityDescendents({
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

  const result: ActivityDescendents = {
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

export async function updateActivityDescendents({
  activityId,
  activityDescendents,
  userId,
  enrolledAs,
  tx,
}: {
  activityId: string;
  activityDescendents: ActivityDescendents;
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
      rows: activityDescendents.activityItems,
    }),
    evalKeyService.update({
      ...baseParams,
      rows: activityDescendents.evalKeys,
    }),
    questionService.update({
      ...baseParams,
      rows: activityDescendents.questions,
    }),
    infoTextService.update({
      ...baseParams,
      rows: activityDescendents.infoTexts,
    }),
    infoImageService.update({
      ...baseParams,
      rows: activityDescendents.infoImages,
    }),
    threadService.update({
      ...baseParams,
      rows: activityDescendents.threads,
    }),
    messageService.update({
      ...baseParams,
      rows: activityDescendents.messages,
    }),
  ]);

  const result: ActivityDescendents = {
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

export async function deleteActivityDescendents({
  activityId,
  userId,
  enrolledAs,
  activityDescendentIds,
  tx,
}: {
  activityId: string;
  userId: string;
  enrolledAs: EnrollmentType[];
  activityDescendentIds: ActivityDescendentIds;
  tx: DbOrTx;
}) {
  const baseParams = {
    userId,
    activityId,
    enrolledAs,
    activityDescendentIds,
    tx,
  };

  const toAwait = Array<Promise<void>>();

  for (const descendentName of activityDescendentNames) {
    switch (descendentName) {
      case "activityItems":
        toAwait.push(
          activityItemService.delete({
            ...baseParams,
            ids: activityDescendentIds.activityItems,
          }),
        );
        return true;
      case "evalKeys":
        toAwait.push(
          evalKeyService.delete({
            ...baseParams,
            ids: activityDescendentIds.evalKeys,
          }),
        );
        return true;
      case "questions":
        toAwait.push(
          questionService.delete({
            ...baseParams,
            ids: activityDescendentIds.questions,
          }),
        );
        return true;
      case "infoTexts":
        toAwait.push(
          infoTextService.delete({
            ...baseParams,
            ids: activityDescendentIds.infoTexts,
          }),
        );
        return true;
      case "infoImages":
        toAwait.push(
          infoImageService.delete({
            ...baseParams,
            ids: activityDescendentIds.infoImages,
          }),
        );
        return true;
      case "threads":
        toAwait.push(
          threadService.delete({
            ...baseParams,
            ids: activityDescendentIds.threads,
          }),
        );
        return true;
      case "messages":
        toAwait.push(
          messageService.delete({
            ...baseParams,
            ids: activityDescendentIds.messages,
          }),
        );
        return true;
      default:
        assertNever(descendentName);
    }
  }

  await Promise.all(toAwait);
}

export async function modifyActivityDescendents({
  activityId,
  activityDescendentModification,
  userId,
  enrolledAs,
  tx,
}: {
  activityId: string;
  activityDescendentModification: ActivityDescendentModification;
  userId: string;
  enrolledAs: EnrollmentType[];
  tx: DbOrTx;
}) {
  const { toCreate, toUpdate, toDelete } = clone(
    activityDescendentModification,
  );

  // ensure deleted objects are not included in the toCreate or toUpdate objects
  objectEntries(toDelete).forEach(([descendentName, ids]) => {
    const deleting = new Set(ids);
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
    createActivityDescendents({
      ...baseParams,
      activityDescendents: toCreate,
    }),
    updateActivityDescendents({
      ...baseParams,
      activityDescendents: toUpdate,
    }),
    deleteActivityDescendents({
      ...baseParams,
      activityDescendentIds: toDelete,
    }),
  ]);

  return {
    created,
    updated,
  };
}
