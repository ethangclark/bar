import { inArray } from "drizzle-orm";
import { canViewDevelopmentData } from "~/common/schemas/enrollmentTypeUtils";
import { type RichActivity } from "~/common/schemas/richActivity";
import { type DbOrTx, db } from "../db";
import { type EvalKey } from "../db/schema";

export async function getEvalKeys(
  activity: RichActivity,
  tx: DbOrTx,
): Promise<EvalKey[]> {
  if (!canViewDevelopmentData(activity.course.enrolledAs)) {
    return [];
  }
  const questionIds = Array<string>();
  for (const ai of activity.activityItems) {
    if (ai.question) {
      questionIds.push(ai.question.id);
    }
  }
  const evalKeys = await tx.query.evalKeys.findMany({
    where: inArray(db.x.evalKeys.questionId, questionIds),
  });
  return evalKeys;
}
