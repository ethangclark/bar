import { z } from "zod";

export const enrollmentTypeSchema = z.enum([
  "student",
  "teacher",
  "ta",
  "designer",
  "observer",
]);
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
