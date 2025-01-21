import {
  type Activity,
  type ActivityItemWithChildren,
} from "~/server/db/schema";
import { type LmsAssignment } from "~/server/integrations/utils/integrationApi";

export type RichActivity = Activity & {
  assignment: LmsAssignment;
  activityItems: ActivityItemWithChildren[];
};
