import { eq } from "drizzle-orm";
import { isDesigner } from "~/common/schemas/enrollmentTypeUtils";
import { type RichActivity } from "~/common/schemas/richActivity";
import { assertNever } from "~/common/utils/errorUtils";
import { noop } from "~/common/utils/fnUtils";
import { createEmptyTables, rowsToTable } from "~/common/utils/tableUtils";
import { db, DbOrTx } from "~/server/db";
import {
  type IntegrationApi,
  type LmsAssignment,
} from "~/server/integrations/utils/integrationApi";
import { getIntegrationApi } from "~/server/services/integrationService";
import { Activity } from "../db/schema";
import {
  deleteTables,
  insertTables,
  updateTables,
} from "./tables/tableService";
import { ModificationOps, TableSet } from "./tables/tableSetSchema";
import { objectEntries } from "~/common/utils/objectUtils";

// does not check that user has access to the activity
export async function unsafe_getActivityTables(
  activityId: string,
): Promise<{ activity: Activity; tables: TableSet }> {
  const withTables = await db.query.activities.findFirst({
    where: eq(db.x.activities.id, activityId),
    with: {
      activityItems: true,
      questions: true,
      infoTexts: true,
      infoImages: true,
      evalKeys: true,
      threads: true,
      messages: true,
    },
  });
  if (!withTables) {
    throw new Error("Activity not found");
  }
  const {
    activityItems,
    questions,
    infoTexts,
    infoImages,
    evalKeys,
    threads,
    messages,
    ...rest
  } = withTables;
  const activity = {
    ...rest,
    activityId: rest.id,
  };
  const tables: TableSet = {
    activities: { [activity.id]: activity },
    activityItems: rowsToTable(activityItems),
    questions: rowsToTable(questions),
    infoTexts: rowsToTable(infoTexts),
    infoImages: rowsToTable(infoImages),
    evalKeys: rowsToTable(evalKeys),
    threads: rowsToTable(threads),
    messages: rowsToTable(messages),
  };
  return { activity, tables };
}
type Unsafe_ActivityTables = Awaited<
  ReturnType<typeof unsafe_getActivityTables>
>;

async function ensureAccess({
  userId,
  integrationApi,
  unsafe_tables,
}: {
  userId: string;
  integrationApi: IntegrationApi;
  unsafe_tables: Unsafe_ActivityTables;
}) {
  const { activity, tables } = unsafe_tables;

  const course = await integrationApi.getCourse({
    userId,
    exCourseIdJson: activity.exCourseIdJson,
  });

  // ensure that the activity is associated with an assignment that's visible to the user
  // (hiding unpublished assignments from students)
  let assignment: LmsAssignment | null = null;
  for (const a of course.assignments) {
    if (a.activity?.id !== activity.id) {
      continue;
    }
    if (isDesigner(course.enrolledAs)) {
      assignment = a;
    }
    switch (a.activity.status) {
      case "published":
        assignment = a;
      case "draft":
        // do nothing;
        continue;
    }
    assertNever(a.activity.status);
  }
  if (!course || !assignment) {
    throw new Error("Activity not found");
  }

  return { course, assignment, activity, tables };
}

export async function getActivity({
  assertAccess,
  userId,
  activityId,
}: {
  assertAccess: true;
  userId: string;
  activityId: string;
}) {
  // This function asserts that access is allowed.
  // Requiring the assertAccess param just to make this clear.
  noop(assertAccess);

  const unsafe_tables = await unsafe_getActivityTables(activityId);

  const integrationApi = await getIntegrationApi({
    userId,
    integrationId: unsafe_tables.activity.integrationId,
  });

  const { course, assignment, activity, tables } = await ensureAccess({
    userId,
    integrationApi,
    unsafe_tables,
  });

  return { course, assignment, activity, tables };
}

// returns ops such that their IDs can't have been manipulated
// to access/modify resources they should not have access to
function getSecureOps({
  activity,
  modificationOps,
}: {
  activity: RichActivity;
  modificationOps: ModificationOps;
}) {
  if (1) {
    throw new Error("Not implemented");
  }
  return modificationOps;
}

async function assignTableSet(toTableSet: TableSet, fromTableSet: TableSet) {
  objectEntries(fromTableSet).forEach(([tableKey, table]) => {
    objectEntries(table).forEach(([id, row]) => {
      toTableSet[tableKey][id] = row;
    });
  });
}

export async function applyModificationOps({
  ensureOpsFitActivity,
  activity,
  modificationOps: rawOps,
  tx,
}: {
  ensureOpsFitActivity: true;
  activity: RichActivity;
  modificationOps: ModificationOps;
  tx: DbOrTx;
}) {
  // this is just to call out what exactly the function is responsible for
  noop(ensureOpsFitActivity);

  // TODO: check that the ops fit the activity
  const modificationOps = getSecureOps({ activity, modificationOps: rawOps });

  const { toCreate, toUpdate, toDelete } = modificationOps;
  const result = createEmptyTables();
  await Promise.all([
    insertTables(activity.id, toCreate, tx).then((tableSet) =>
      assignTableSet(result, tableSet),
    ),
    updateTables(activity.id, toUpdate, tx).then((tableSet) =>
      assignTableSet(result, tableSet),
    ),
    deleteTables(activity.id, toDelete, tx),
  ]);
  return result;
}
