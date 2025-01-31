import { z } from "zod";
/*
THIS FILE SHOULD NOT HAVE ANY DEPENDENCIES ON THE SERVER OR CLIENT
*/

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
