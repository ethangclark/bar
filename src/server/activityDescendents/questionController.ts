import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isDeveloper } from "~/common/enrollmentTypeUtils";
import { questions, type Question } from "~/server/db/schema";
import { type ActivityDescendentController } from "~/server/activityDescendents/types";

export const questionService: ActivityDescendentController<Question> = {
  async create({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const question = await tx
      .insert(questions)
      .values(rows.map((row) => ({ ...row, activityId })))
      .returning();
    return question;
  },
  async read({ activityId, tx }) {
    return tx
      .select()
      .from(questions)
      .where(eq(questions.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const questionsNested = await Promise.all(
      rows.map((row) =>
        tx
          .update(questions)
          .set({ ...row, activityId })
          .where(
            and(eq(questions.id, row.id), eq(questions.activityId, activityId)),
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
      .delete(questions)
      .where(
        and(inArray(questions.id, ids), eq(questions.activityId, activityId)),
      );
  },
};
