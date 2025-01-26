import { inArray } from "drizzle-orm";
import { canViewDevelopmentData } from "~/common/schemas/enrollmentTypeUtils";
import { type RichActivity } from "~/common/schemas/richActivity";
import { type DbOrTx, db } from "../db";
import { type EvalKey } from "../db/schema";

export async function getEvalKeys(
  activity: RichActivity,
  tx: DbOrTx,
): Promise<{ questionIdToEvalKey: Map<string, EvalKey[]> }> {
  if (!canViewDevelopmentData(activity.course.enrolledAs)) {
    return { questionIdToEvalKey: new Map() };
  }
  const questionIds = Array<string>();
  for (const ai of activity.activityItems) {
    for (const q of ai.questions) {
      questionIds.push(q.id);
    }
  }
  const evalKeys = await tx.query.evalKeys.findMany({
    where: inArray(db.x.evalKeys.questionId, questionIds),
  });
  const questionIdToEvalKey = new Map<string, EvalKey[]>();
  for (const ek of evalKeys) {
    const existing = questionIdToEvalKey.get(ek.questionId) ?? [];
    existing.push(ek);
    questionIdToEvalKey.set(ek.questionId, existing);
  }
  return { questionIdToEvalKey };
}
