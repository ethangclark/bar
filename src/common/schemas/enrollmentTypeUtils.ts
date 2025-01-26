import { z } from "zod";

export const enrollmentTypeSchema = z.enum([
  "student",
  "teacher",
  "ta",
  "designer",
  "observer",
]);
export type EnrollmentType = z.infer<typeof enrollmentTypeSchema>;

const developmentViewers = new Set<EnrollmentType>([
  "teacher",
  "ta",
  "designer",
]);
export function canViewDevelopmentData(enrollmentTypes: EnrollmentType[]) {
  return enrollmentTypes.some((et) => developmentViewers.has(et));
}
