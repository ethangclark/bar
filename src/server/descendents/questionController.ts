import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { type EnrollmentType, isDeveloper } from "~/common/enrollmentTypeUtils";
import { type Question } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/descendentTypes";
import { db } from "../db";

function canRead() {
  return true;
}

function canWrite(enrolledAs: EnrollmentType[]) {
  return isDeveloper(enrolledAs);
}

export const questionController: DescendentController<Question> = {
  canRead,
  canWrite(_, { enrolledAs }) {
    return canWrite(enrolledAs);
  },
  async create({ activityId, enrolledAs, tx, rows }) {
    if (!canWrite(enrolledAs)) {
      return [];
    }
    const questions = await tx
      .insert(db.x.questions)
      .values(rows.map((row) => ({ ...row, activityId })))
      .returning();
    return questions;
  },
  async read({ activityId, tx }) {
    if (!canRead()) {
      return [];
    }
    return tx
      .select()
      .from(db.x.questions)
      .where(eq(db.x.questions.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!canWrite(enrolledAs)) {
      return [];
    }
    const questionsNested = await Promise.all(
      rows.map((row) =>
        tx
          .update(db.x.questions)
          .set({ ...row, activityId })
          .where(
            and(
              eq(db.x.questions.id, row.id),
              eq(db.x.questions.activityId, activityId),
            ),
          )
          .returning(),
      ),
    );
    return questionsNested.flat();
  },
  async delete({ activityId, enrolledAs, tx, ids }) {
    if (!canWrite(enrolledAs)) {
      return;
    }
    await tx
      .delete(db.x.questions)
      .where(
        and(
          inArray(db.x.questions.id, ids),
          eq(db.x.questions.activityId, activityId),
        ),
      );
  },
};
