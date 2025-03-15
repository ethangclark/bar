import {
  type AfterTx,
  createEmptyDescendents,
  type DescendentController,
  type DescendentName,
  descendentNames,
  type DescendentRows,
  type Descendents,
  type Modifications,
  rectifyModifications,
} from "~/common/descendentUtils";
import { type EnrollmentType } from "~/common/enrollmentTypeUtils";
import { objectEntries, objectValues } from "~/common/objectUtils";
import { type DbOrTx } from "~/server/db";
import { completionController } from "./completionController";
import { evalKeyController } from "./evalKeyController";
import { infoImageController } from "./infoImageController";
import { infoTextController } from "./infoTextController";
import { infoVideoController } from "./infoVideoController";
import { itemController } from "./itemController";
import { messageController } from "./messageController";
import { questionController } from "./questionController";
import { threadController } from "./threadController";
import { viewPieceController } from "./viewPieceController";
import { viewPieceImageController } from "./viewPieceImageController";
import { viewPieceTextController } from "./viewPieceTextController";
import { viewPieceVideoController } from "./viewPieceVideoController";

type Controllers = {
  [K in DescendentName]: DescendentController<DescendentRows[K]>;
};

export const controllers: Controllers = {
  items: itemController,
  evalKeys: evalKeyController,
  questions: questionController,
  infoTexts: infoTextController,
  infoImages: infoImageController,
  infoVideos: infoVideoController,
  threads: threadController,
  messages: messageController,
  viewPieces: viewPieceController,
  viewPieceImages: viewPieceImageController,
  viewPieceTexts: viewPieceTextController,
  viewPieceVideos: viewPieceVideoController,
  completions: completionController,
};

export async function createDescendents({
  activityId,
  enrolledAs,
  descendents,
  userId,
  tx,
  enqueueSideEffect,
}: {
  activityId: string;
  enrolledAs: EnrollmentType[];
  descendents: Descendents;
  userId: string;
  tx: DbOrTx;
  enqueueSideEffect: AfterTx;
}) {
  const baseParams = {
    userId,
    activityId,
    enrolledAs,
    tx,
    enqueueSideEffect,
  };

  const result: Partial<Descendents> = {};

  for (const name of descendentNames) {
    const rows = descendents[name];

    // important so Drizzle doesn't throw its "hurr durr no rows" error
    if (rows.length === 0) {
      result[name] = [];
      continue;
    }

    result[name] = (await controllers[name].create({
      ...baseParams,
      rows,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)) as any;
  }

  return result as Descendents;
}

export async function readDescendents({
  activityId,
  userId,
  enrolledAs,
  includeUserIds,
  tx,
  enqueueSideEffect,
}: {
  activityId: string;
  userId: string;
  enrolledAs: EnrollmentType[];
  includeUserIds: string[];
  tx: DbOrTx;
  enqueueSideEffect: AfterTx;
}) {
  const params = {
    userId,
    activityId,
    enrolledAs,
    includeUserIds,
    tx,
    enqueueSideEffect,
  };

  const result: Partial<Descendents> = {};

  // TODO: this is sketchy due to tx considerations --
  // is it better or worse that we're doing this in serial?
  // Would it be better to force no-tx reading?
  for (const name of descendentNames) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result[name] = (await controllers[name].read(params)) as any;
  }

  return result as Descendents;
}

export async function updateDescendents({
  activityId,
  descendents,
  userId,
  enrolledAs,
  tx,
  enqueueSideEffect,
}: {
  activityId: string;
  descendents: Descendents;
  userId: string;
  enrolledAs: EnrollmentType[];
  tx: DbOrTx;
  enqueueSideEffect: AfterTx;
}) {
  const baseParams = {
    userId,
    activityId,
    enrolledAs,
    tx,
    enqueueSideEffect,
  };

  const result: Partial<Descendents> = {};

  for (const name of descendentNames) {
    const rows = descendents[name];

    // important so Drizzle doesn't throw its "hurr durr no rows" error
    if (rows.length === 0) {
      result[name] = [];
      continue;
    }

    result[name] = (await controllers[name].update({
      ...baseParams,
      rows,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)) as any;
  }

  return result as Descendents;
}

export async function deleteDescendents({
  activityId,
  userId,
  enrolledAs,
  descendents,
  tx,
  enqueueSideEffect,
}: {
  activityId: string;
  userId: string;
  enrolledAs: EnrollmentType[];
  descendents: Descendents;
  tx: DbOrTx;
  enqueueSideEffect: AfterTx;
}) {
  const baseParams = {
    userId,
    activityId,
    enrolledAs,
    descendents,
    tx,
    enqueueSideEffect,
  };

  await Promise.all(
    descendentNames.map((descendentName) => {
      const ids = descendents[descendentName].map((d) => d.id);

      // important so Drizzle doesn't throw its "hurr durr no rows" error
      if (ids.length === 0) {
        return;
      }

      return controllers[descendentName].delete({
        ...baseParams,
        ids,
      });
    }),
  );
}

export async function modifyDescendents(params: {
  activityId: string;
  modifications: Modifications;
  userId: string;
  enrolledAs: EnrollmentType[];
  tx: DbOrTx;
  enqueueSideEffect: AfterTx;
}): Promise<Modifications> {
  const {
    activityId,
    modifications,
    userId,
    enrolledAs,
    tx,
    enqueueSideEffect,
  } = params;

  const modIn = rectifyModifications(modifications);
  const notYetCreatedIds = new Set(
    objectValues(modIn.toCreate).flatMap((descendents) =>
      descendents.map((d) => d.id),
    ),
  );

  const deferred: Modifications = {
    toCreate: createEmptyDescendents(),
    toUpdate: createEmptyDescendents(),
    toDelete: createEmptyDescendents(),
  };

  // Defer creation of dependent rows until dependencies are created.
  // MUTATES `modIn` AND MUTATES `deferred`!
  let anotherPassNeeded = false;
  objectEntries({
    toCreate: modIn.toCreate,
    toUpdate: modIn.toUpdate,
  }).forEach(([modType, descendents]) => {
    descendentNames.forEach((descendentName) => {
      const rows = descendents[descendentName];
      const newRows = Array<(typeof rows)[number]>();
      rows.forEach((row) => {
        let deferThisRow = false;
        for (const fieldVal of objectValues(row)) {
          if (typeof fieldVal !== "string" || fieldVal === row.id) {
            continue;
          }
          if (notYetCreatedIds.has(fieldVal)) {
            anotherPassNeeded = true;
            deferThisRow = true;
            break;
          }
        }
        if (deferThisRow) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          deferred[modType][descendentName].push(row as any);
        } else {
          newRows.push(row);
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      descendents[descendentName] = newRows as any;
    });
  });

  const baseParams = {
    userId,
    activityId,
    enrolledAs,
    tx,
    enqueueSideEffect,
  };

  const [created, updated] = await Promise.all([
    createDescendents({
      ...baseParams,
      descendents: modIn.toCreate,
    }),
    updateDescendents({
      ...baseParams,
      descendents: modIn.toUpdate,
    }),
    deleteDescendents({
      ...baseParams,
      descendents: modIn.toDelete,
    }),
  ]);

  const modOut: Modifications = {
    toCreate: created,
    toUpdate: updated,
    toDelete: modIn.toDelete,
  };

  if (anotherPassNeeded) {
    const nextResult = await modifyDescendents({
      ...params,
      modifications: deferred,
    });
    objectEntries(nextResult).forEach(([modType, descendents]) => {
      objectEntries(descendents).forEach(([descendentName, rows]) => {
        rows.forEach((row) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          modOut[modType][descendentName].push(row as any);
        });
      });
    });
  }

  return modOut;
}
