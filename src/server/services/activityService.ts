import { eq, inArray } from "drizzle-orm";
import { type RichActivity } from "~/common/schemas/richActivity";
import { type ModificationOps } from "~/common/utils/activityUtils";
import { assertNever } from "~/common/utils/errorUtils";
import { asserted, invoke, noop } from "~/common/utils/fnUtils";
import { db } from "~/server/db";
import {
  type LmsCourse,
  type LmsAssignment,
} from "~/server/integrations/utils/integrationApi";
import { getIntegrationApis } from "~/server/services/integrationService";
import {
  type Question,
  type ActivityItemWithChildren,
  type InfoText,
  type InfoImage,
} from "../db/schema";
import { objectKeys } from "~/common/utils/objectUtils";

// does not check that user has access to the activity
export async function getActivity_UNSAFE(activityId: string) {
  const activity = await db.query.activities.findFirst({
    where: eq(db.x.activities.id, activityId),
    with: {
      activityItems: {
        with: {
          questions: true,
          infoTexts: true,
          infoImages: true,
        },
      },
    },
  });
  if (!activity) {
    throw new Error("Activity not found");
  }
  return activity;
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

  const [integrationApis, activity] = await Promise.all([
    getIntegrationApis(userId),
    getActivity_UNSAFE(activityId),
  ]);

  const integrationApi = integrationApis.find(
    (i) => i.integration.id === activity.integrationId,
  );

  // ensure that the activity belongs to an integration that's associated with the user
  if (!integrationApi) {
    throw new Error("Activity not found");
  }

  // ensure that the activity is associated with an assignment that's visible to the user
  // (hiding unpublished assignments from students)
  const courses = await integrationApi.getCourses({ userId });
  let course: LmsCourse | null = null;
  let assignment: LmsAssignment | null = null;
  for (const c of courses) {
    for (const a of c.assignments) {
      if (a.activity?.id !== activity.id) {
        continue;
      }
      if (
        c.enrolledAs.includes("teacher") ||
        c.enrolledAs.includes("ta") ||
        c.enrolledAs.includes("designer")
      ) {
        course = c;
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
  }
  if (!course || !assignment) {
    throw new Error("Activity not found");
  }

  return { course, assignment, ...activity };
}

export async function assertActivityAccess({
  userId,
  activityId,
}: {
  userId: string;
  activityId: string;
}) {
  await getActivity({ userId, activityId, assertAccess: true });
}

// could add tests to ensure IDs are omitted

async function createQuestions(questions: Question[]) {
  if (!questions.length) return;
  await db
    .insert(db.x.questions)
    .values(questions.map(({ id: _, ...q }) => q))
    .returning();
}
async function createInfoTexts(infoTexts: InfoText[]) {
  if (!infoTexts.length) return;
  await db
    .insert(db.x.infoTexts)
    .values(infoTexts.map(({ id: _, ...i }) => i))
    .returning();
}
async function createInfoImages(infoImages: InfoImage[]) {
  if (!infoImages.length) return;
  await db
    .insert(db.x.infoImages)
    .values(infoImages.map(({ id: _, ...i }) => i))
    .returning();
}

// could add tests to ensure IDs are omitted

async function createItems({ drafts }: { drafts: ActivityItemWithChildren[] }) {
  const [draft1] = drafts;
  if (!draft1) return;
  const created = await db
    .insert(db.x.activityItems)
    .values(drafts.map(({ id: _, ...i }) => i))
    .returning();
  const promises = Array<Promise<void>>();
  objectKeys(draft1).forEach((key) => {
    invoke((): true => {
      switch (key) {
        // fields we don't need to do anything with
        case "id":
        case "activityId":
        case "orderFracIdx":
          return true;
        case "questions": {
          promises.push(
            createQuestions(
              drafts
                .map((i, idx) =>
                  i.questions.map((q) => ({
                    ...q,
                    activityItemId: asserted(created[idx]).id,
                  })),
                )
                .flat(),
            ),
          );
          return true;
        }
        case "infoTexts": {
          promises.push(
            createInfoTexts(
              drafts
                .map((i, idx) =>
                  i.infoTexts.map((i) => ({
                    ...i,
                    activityItemId: asserted(created[idx]).id,
                  })),
                )
                .flat(),
            ),
          );
          return true;
        }
        case "infoImages": {
          promises.push(
            createInfoImages(
              drafts
                .map((i, idx) =>
                  i.infoImages.map((i) => ({
                    ...i,
                    activityItemId: asserted(created[idx]).id,
                  })),
                )
                .flat(),
            ),
          );
          return true;
        }
      }
    });
  });
  await Promise.all(promises);
}

async function updateQuestions(questions: Question[]) {
  if (!questions.length) return;
  await Promise.all(
    questions.map((q) =>
      db.update(db.x.questions).set(q).where(eq(db.x.questions.id, q.id)),
    ),
  );
}
async function updateInfoTexts(infoTexts: InfoText[]) {
  if (!infoTexts.length) return;
  await Promise.all(
    infoTexts.map((i) =>
      db.update(db.x.infoTexts).set(i).where(eq(db.x.infoTexts.id, i.id)),
    ),
  );
}
async function updateInfoImages(infoImages: InfoImage[]) {
  if (!infoImages.length) return;
  await Promise.all(
    infoImages.map((i) =>
      db.update(db.x.infoImages).set(i).where(eq(db.x.infoImages.id, i.id)),
    ),
  );
}

async function updateItems({ items }: { items: ActivityItemWithChildren[] }) {
  const promises = Array<Promise<unknown>>();
  for (const item of items) {
    promises.push(
      db
        .update(db.x.activityItems)
        .set(item)
        .where(eq(db.x.activityItems.id, item.id)),
    );
    objectKeys(item).forEach((key) => {
      invoke((): true => {
        switch (key) {
          // fields we don't need to do anything with
          case "id":
          case "activityId":
          case "orderFracIdx":
            return true;
          case "questions": {
            promises.push(updateQuestions(item.questions));
            return true;
          }
          case "infoTexts": {
            promises.push(updateInfoTexts(item.infoTexts));
            return true;
          }
          case "infoImages": {
            promises.push(updateInfoImages(item.infoImages));
            return true;
          }
        }
      });
    });
  }
  await Promise.all(promises);
}

async function deleteItems(ids: string[]) {
  if (!ids.length) return;
  await db
    .delete(db.x.activityItems)
    .where(inArray(db.x.activityItems.id, ids));
}

// returns false if child IDs don't point to parent
function childrenFit(item: ActivityItemWithChildren): boolean {
  for (const key of objectKeys(item)) {
    const isOk = invoke((): boolean => {
      switch (key) {
        case "id":
        case "activityId":
        case "orderFracIdx":
          return true;
        case "questions":
          return item.questions.every((q) => q.activityItemId === item.id);
        case "infoTexts":
          return item.infoTexts.every((i) => i.activityItemId === item.id);
        case "infoImages":
          return item.infoImages.every((i) => i.activityItemId === item.id);
      }
    });
    if (!isOk) return false;
  }
  return true;
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
  const { toCreate, toUpdate, toDelete } = modificationOps;
  const secureOps: ModificationOps = {
    toCreate: toCreate.filter(
      (item) => item.activityId === activity.id && childrenFit(item),
    ),
    toUpdate: toUpdate.filter(
      (item) => item.activityId === activity.id && childrenFit(item),
    ),
    toDelete: toDelete.filter((id) =>
      activity.activityItems.some((i) => i.id === id),
    ),
  };
  return secureOps;
}

export async function applyModificationOps({
  ensureOpsFitActivity,
  activity,
  modificationOps: rawOps,
}: {
  ensureOpsFitActivity: true;
  activity: RichActivity;
  modificationOps: ModificationOps;
}) {
  // this is just to call out what exactly the function is responsible for
  noop(ensureOpsFitActivity);
  const modificationOps = getSecureOps({ activity, modificationOps: rawOps });

  const { toCreate, toUpdate, toDelete } = modificationOps;
  await Promise.all([
    createItems({ drafts: toCreate }),
    updateItems({ items: toUpdate }),
    deleteItems(toDelete),
  ]);
}
