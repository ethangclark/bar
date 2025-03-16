import { z } from "zod";
import { assertTypesExhausted } from "./assertions";

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

export function enrollmentTypeLabel(enrollmentType: EnrollmentType) {
  switch (enrollmentType) {
    case "student":
      return "Student";
    case "teacher":
      return "Instructor";
    case "ta":
      return "TA";
    case "designer":
      return "Designer";
    case "observer":
      return "Observer";
    default:
      assertTypesExhausted(enrollmentType);
  }
}

export function enrollmentTypeColorClassName(enrollmentType: EnrollmentType) {
  switch (enrollmentType) {
    case "teacher":
      return "text-blue-500";
    case "student":
    case "ta":
    case "designer":
    case "observer":
      return "";
    default:
      assertTypesExhausted(enrollmentType);
  }
}

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
