import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isDeveloper } from "~/common/enrollmentTypeUtils";
import { type Question } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/descendentTypes";
import { db } from "../db";

export const questionController: DescendentController<Question> = {
  async create({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const questions = await tx
      .insert(db.x.questions)
      .values(rows.map((row) => ({ ...row, activityId })))
      .returning();
    return questions;
  },
  async read({ activityId, tx }) {
    return tx
      .select()
      .from(db.x.questions)
      .where(eq(db.x.questions.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
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
    if (!isDeveloper(enrolledAs)) {
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
