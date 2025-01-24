import { z } from "zod";

export const enrollmentTypeSchema = z.enum([
  "student",
  "teacher",
  "ta",
  "designer",
  "observer",
]);
export type EnrollmentType = z.infer<typeof enrollmentTypeSchema>;
