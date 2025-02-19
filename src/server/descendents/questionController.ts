import { and, eq, inArray } from "drizzle-orm";
import { isDeveloper } from "~/common/enrollmentTypeUtils";
import { type Question } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/descendentTypes";
import { schema } from "../db";

function canRead() {
  return true;
}

export const questionController: DescendentController<Question> = {
  canRead,
  async create({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const questions = await tx
      .insert(schema.questions)
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
      .from(schema.questions)
      .where(eq(schema.questions.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const questionsNested = await Promise.all(
      rows.map((row) =>
        tx
          .update(schema.questions)
          .set({ ...row, activityId })
          .where(
            and(
              eq(schema.questions.id, row.id),
              eq(schema.questions.activityId, activityId),
            ),
          )
          .returning(),
      ),
    );
    return questionsNested.flat();
  },
  async delete({ activityId, enrolledAs, tx, ids }) {
    if (!isDeveloper(enrolledAs)) {
      return;
    }
    await tx
      .delete(schema.questions)
      .where(
        and(
          inArray(schema.questions.id, ids),
          eq(schema.questions.activityId, activityId),
        ),
      );
  },
};
