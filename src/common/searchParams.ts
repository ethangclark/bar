import { z } from "zod";

const viewModes = ["editor", "doer", "submissions"] as const;
const viewModeSchema = z.enum(viewModes);
export type ViewMode = z.infer<typeof viewModeSchema>;

const loginTypes = ["instructor"] as const;
export const loginTypeSchema = z.enum(loginTypes);
export type LoginType = z.infer<typeof loginTypeSchema>;

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
  loginType: {
    key: "role" as const,
    schema: loginTypeSchema,
  },
};

export type SearchParamName = keyof typeof searchParamsX;

export type SearchParamsX = Partial<{
  [key in keyof typeof searchParamsX]: z.infer<
    (typeof searchParamsX)[key]["schema"]
  >;
}>;
