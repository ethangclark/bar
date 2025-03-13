import { z } from "zod";

const viewModes = ["editor", "doer", "submissions"] as const;
const viewModeSchema = z.enum(viewModes);
export type ViewMode = z.infer<typeof viewModeSchema>;

export const searchParamsX = {
  loginToken: {
    key: "token" as const,
    schema: z.string(),
  },
  redirectUrl: {
    key: "redirect" as const,
    schema: z.string(),
  },
  activityViewMode: {
    key: "view" as const,
    schema: viewModeSchema,
  },
};

export type SearchParamName = keyof typeof searchParamsX;

export type SearchParamsX = Partial<{
  [key in keyof typeof searchParamsX]: z.infer<
    (typeof searchParamsX)[key]["schema"]
  >;
}>;
