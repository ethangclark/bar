import { type DescendentName, descendentNames } from "~/common/descendentNames";
import {
  createEmptyDescendents,
  mergeDescendents,
  rectifyModifications,
} from "~/common/descendentUtils";
import { type EnrollmentType } from "~/common/enrollmentTypeUtils";
import { objectEntries, objectValues } from "~/common/objectUtils";
import { type DbOrTx } from "~/server/db";
import { evalKeyController } from "./evalKeyController";
import { infoImageController } from "./infoImageController";
import { infoTextController } from "./infoTextController";
import { itemController } from "./itemController";
import { messageController } from "./messageController";
import { questionController } from "./questionController";
import { threadController } from "./threadController";
import {
  type AfterTx,
  type DescendentController,
  type DescendentRows,
  type Descendents,
  type Modifications,
} from "./descendentTypes";

type Controllers = {
  [K in DescendentName]: DescendentController<DescendentRows[K]>;
};

export const controllers: Controllers = {
  items: itemController,
  evalKeys: evalKeyController,
  questions: questionController,
  infoTexts: infoTextController,
  infoImages: infoImageController,
  threads: threadController,
  messages: messageController,
};

export async function createDescendents({
  activityId,
  enrolledAs,
  descendents,
  userId,
  tx,
  afterTx,
}: {
  activityId: string;
  enrolledAs: EnrollmentType[];
  descendents: Descendents;
  userId: string;
  tx: DbOrTx;
  afterTx: AfterTx;
}) {
  const baseParams = {
    userId,
    activityId,
    enrolledAs,
    tx,
    afterTx,
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

  const result: Partial<Descendents> = {};

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
  afterTx,
}: {
  activityId: string;
  descendents: Descendents;
  userId: string;
  enrolledAs: EnrollmentType[];
  tx: DbOrTx;
  afterTx: AfterTx;
}) {
  const baseParams = {
    userId,
    activityId,
    enrolledAs,
    tx,
    afterTx,
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
  afterTx,
}: {
  activityId: string;
  userId: string;
  enrolledAs: EnrollmentType[];
  descendents: Descendents;
  tx: DbOrTx;
  afterTx: AfterTx;
}) {
  const baseParams = {
    userId,
    activityId,
    enrolledAs,
    descendents,
    tx,
    afterTx,
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
  afterTx: AfterTx;
}): Promise<Descendents> {
  const { activityId, modifications, userId, enrolledAs, tx, afterTx } = params;

  const rectified = rectifyModifications(modifications);
  const { toCreate, toUpdate, toDelete } = rectified;

  const notYetCreatedIds = new Set(
    objectValues(toCreate).flatMap((descendents) =>
      descendents.map((d) => d.id),
    ),
  );

  const deferred: Modifications = {
    toCreate: createEmptyDescendents(),
    toUpdate: createEmptyDescendents(),
    toDelete: createEmptyDescendents(),
  };

  // defer creation of dependent rows until dependencies are created
  let anotherPassNeeded = false;
  objectEntries({ toCreate, toUpdate }).forEach(([modType, descendents]) => {
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
    afterTx,
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

  const thisPassResult = mergeDescendents(created, updated);

  if (anotherPassNeeded) {
    const nextResult = await modifyDescendents({
      ...params,
      modifications: deferred,
    });
    return mergeDescendents(thisPassResult, nextResult);
  }

  return thisPassResult;
}
