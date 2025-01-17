import { type Activity, type IntegrationType } from "~/server/db/schema";

export type LmsCourse = { id: string; title: string; activities: Activity[] };
type Grading = { type: "points"; pointsPossible: number };
type Score = { type: "points"; points: number };

export type IntegrationApi = {
  type: IntegrationType;
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
