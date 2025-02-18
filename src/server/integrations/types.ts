import {
  type Activity,
  type Integration,
  type IntegrationActivity,
  type IntegrationType,
} from "~/server/db/schema";
import { type NarrowedCanvasEnrollmentType } from "./canvas/utils";

export type LmsAssignment = {
  exAssignmentIdJson: string;
  title: string;
  dueAt: Date | null;
  lockedAt: Date | null;
  integrationActivity: IntegrationActivity;
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
  getCourse: (params: {
    userId: string;
    exCourseIdJson: string;
  }) => Promise<LmsCourse>;
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
