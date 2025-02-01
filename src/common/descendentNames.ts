import { z } from "zod";
/*
THIS FILE SHOULD NOT HAVE ANY DEPENDENCIES ON THE SERVER OR CLIENT
*/

export const descendentNames = [
  "activityItems",
  "evalKeys",
  "questions",
  "infoTexts",
  "infoImages",
  "threads",
  "messages",
] as const;
export const descendentNamesSchema = z.enum(descendentNames);
export type DescendentName = z.infer<typeof descendentNamesSchema>;
