import {
  type EvalKey,
  type Activity,
  type ActivityItemWithChildren,
} from "~/server/db/schema";
import {
  type LmsCourse,
  type LmsAssignment,
} from "~/server/integrations/utils/integrationApi";

export type RichActivity = Activity & {
  course: LmsCourse;
  assignment: LmsAssignment;
  activityItems: ActivityItemWithChildren[];
};

export type RichActivityAndEvalKeys = RichActivity & {
  questionIdToEvalKey: Map<string, EvalKey[]>;
};
