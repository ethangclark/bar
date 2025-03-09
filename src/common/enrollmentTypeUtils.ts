import { z } from "zod";

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
