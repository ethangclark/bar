import {
  type Integration,
  type Activity,
  type IntegrationType,
} from "~/server/db/schema";
import { type NarrowedCanvasEnrollmentType } from "../canvas/utils";

export type LmsAssignment = {
  exIdJson: string;
  title: string;
  dueAt: Date | null;
  lockedAt: Date | null;
  activity: Activity;
};
export type LmsCourse = {
  title: string;
  enrolledAs: NarrowedCanvasEnrollmentType[];
  assignments: LmsAssignment[];
};
type Grading = { type: "points"; pointsPossible: number };
type Score = { type: "points"; points: number };

export type IntegrationApi = {
  type: IntegrationType;
  integration: Integration;
  getCourses: (params: { userId: string }) => Promise<LmsCourse[]>;
  setGrading: (params: {
    userId: string;
    activityId: string;
    grading: Grading;
  }) => Promise<void>;
  submitScore: (params: {
    userId: string;
    activityId: string;
    score: Score;
  }) => Promise<void>;
};
