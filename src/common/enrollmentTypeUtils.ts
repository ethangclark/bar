import { z } from "zod";
import { type RichActivity } from "~/server/services/activity/activityService";

export const enrollmentTypes = [
  "student",
  "teacher",
  "ta",
  "designer",
  "observer",
] as const;
export const allEnrollmentTypes = [...enrollmentTypes];
export const enrollmentTypeSchema = z.enum(enrollmentTypes);
export type EnrollmentType = z.infer<typeof enrollmentTypeSchema>;

const developers = new Set<EnrollmentType>(["teacher", "designer"]);
export function isDeveloper(enrollmentTypes: EnrollmentType[]) {
  return enrollmentTypes.some((et) => developers.has(et));
}

const graders = new Set<EnrollmentType>(["teacher", "ta"]);
export function isGrader(enrollmentTypes: EnrollmentType[]) {
  return enrollmentTypes.some((et) => graders.has(et));
}

const gradersAndDevelopers = new Set([...graders, ...developers]);
export function isGraderOrDeveloper(enrollmentTypes: EnrollmentType[]) {
  return enrollmentTypes.some((et) => gradersAndDevelopers.has(et));
}

export function getEnrolledAs(activity: RichActivity): EnrollmentType[] {
  switch (activity.type) {
    case "integration":
      return activity.course.enrolledAs;
    case "adHoc":
      return allEnrollmentTypes;
  }
}
