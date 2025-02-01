import { type DbOrTx } from "~/server/db";
import { type EnrollmentType } from "~/common/enrollmentTypeUtils";
import {
  type CreateParams,
  type DescendentModification,
  type Descendents,
  type DescendentRows,
  type UpdateParams,
  type ReadParams,
  type DeleteParams,
} from "./types";
import { itemController } from "./itemController";
import { evalKeyController } from "./evalKeyController";
import { infoImageController } from "./infoImageController";
import { infoTextController } from "./infoTextController";
import { messageController } from "./messageController";
import { questionController } from "./questionController";
import { threadController } from "./threadController";
import { type DescendentName, descendentNames } from "~/common/descendentNames";
import { objectEntries } from "~/common/objectUtils";
import { clone } from "~/common/cloneUtils";
import { mergeDescendents } from "~/common/descendentUtils";

type Creators = {
  [K in DescendentName]: (
    params: CreateParams<DescendentRows[K]>,
  ) => Promise<Descendents[K]>;
};
type Readers = {
  [K in DescendentName]: (params: ReadParams) => Promise<Descendents[K]>;
};
type Updaters = {
  [K in DescendentName]: (
    params: UpdateParams<DescendentRows[K]>,
  ) => Promise<Descendents[K]>;
};
type Deletors = {
  [K in DescendentName]: (params: DeleteParams) => Promise<void>;
};

const creators: Creators = {
  items: (params) => itemController.create(params),
  evalKeys: (params) => evalKeyController.create(params),
  questions: (params) => questionController.create(params),
  infoTexts: (params) => infoTextController.create(params),
  infoImages: (params) => infoImageController.create(params),
  threads: (params) => threadController.create(params),
  messages: (params) => messageController.create(params),
};
const readers: Readers = {
  items: (params) => itemController.read(params),
  evalKeys: (params) => evalKeyController.read(params),
  questions: (params) => questionController.read(params),
  infoTexts: (params) => infoTextController.read(params),
  infoImages: (params) => infoImageController.read(params),
  threads: (params) => threadController.read(params),
  messages: (params) => messageController.read(params),
};
const updaters: Updaters = {
  items: (params) => itemController.update(params),
  evalKeys: (params) => evalKeyController.update(params),
  questions: (params) => questionController.update(params),
  infoTexts: (params) => infoTextController.update(params),
  infoImages: (params) => infoImageController.update(params),
  threads: (params) => threadController.update(params),
  messages: (params) => messageController.update(params),
};
const deletors: Deletors = {
  items: (params) => itemController.delete(params),
  evalKeys: (params) => evalKeyController.delete(params),
  questions: (params) => questionController.delete(params),
  infoTexts: (params) => infoTextController.delete(params),
  infoImages: (params) => infoImageController.delete(params),
  threads: (params) => threadController.delete(params),
  messages: (params) => messageController.delete(params),
};

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

  const result: Partial<Descendents> = {};

  for (const name of descendentNames) {
    const rows = descendents[name];

    // important so Drizzle doesn't throw its "hurr durr no rows" error
    if (rows.length === 0) {
      result[name] = [];
      continue;
    }

    const creator = creators[name];
    result[name] = (await creator({
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
    const reader = readers[name];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result[name] = (await reader(params)) as any;
  }

  return result as Descendents;
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

  const result: Partial<Descendents> = {};

  for (const name of descendentNames) {
    const rows = descendents[name];

    // important so Drizzle doesn't throw its "hurr durr no rows" error
    if (rows.length === 0) {
      result[name] = [];
      continue;
    }

    const updater = updaters[name];
    result[name] = (await updater({
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
      const ids = descendents[descendentName].map((d) => d.id);

      // important so Drizzle doesn't throw its "hurr durr no rows" error
      if (ids.length === 0) {
        return;
      }

      const deletor = deletors[descendentName];
      return deletor({
        ...baseParams,
        ids,
      });
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
