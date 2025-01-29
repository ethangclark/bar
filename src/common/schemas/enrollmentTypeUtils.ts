import { z } from "zod";

export const enrollmentTypeSchema = z.enum([
  "student",
  "teacher",
  "ta",
  "designer",
  "observer",
]);
export type EnrollmentType = z.infer<typeof enrollmentTypeSchema>;

const designers = new Set<EnrollmentType>(["teacher", "designer"]);
export function isDesigner(enrollmentTypes: EnrollmentType[]) {
  return enrollmentTypes.some((et) => designers.has(et));
}

const graders = new Set<EnrollmentType>(["teacher", "ta"]);
export function isGrader(enrollmentTypes: EnrollmentType[]) {
  return enrollmentTypes.some((et) => graders.has(et));
}
