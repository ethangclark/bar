import { z } from "zod";

export const activityDescendentNames = [
  "activityItems",
  "evalKeys",
  "questions",
  "infoTexts",
  "infoImages",
  "threads",
  "messages",
] as const;
export const activityDescendentNamesSchema = z.enum(activityDescendentNames);
export type ActivityDescendentName = z.infer<
  typeof activityDescendentNamesSchema
>;
