import { type Activity } from "~/server/db/schema";
import {
  type LmsAssignment,
  type LmsCourse,
} from "~/server/integrations/utils/integrationApi";

export type RichActivity = Activity & {
  course: LmsCourse;
  assignment: LmsAssignment;
};
