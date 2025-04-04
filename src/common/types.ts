import { z } from "zod";

export { type RichActivity } from "~/server/services/activity/activityService";

export type MaybePromise<T = void> = T | Promise<T>;

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
export type Json = Literal | { [key: string]: Json } | Json[];
export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]),
);

type JsonPlus =
  | Literal
  | undefined
  | Date
  | JsonPlus[]
  | { [key: string]: JsonPlus }
  | Set<JsonPlus>
  | Map<string, JsonPlus>;

// I'd prefer to use Parameters<typeof superjson.serialize>[0], but that resolves to `any`
export type SuperJsonValue = JsonPlus;

export type SuperJsonObject = { [key: string]: SuperJsonValue };

export const audioDataXSchema = z.object({
  data: z.string(), // base64 encoded audio
  mimeType: z.string(), // audio MIME type
});
// Types for the audio data structure
export type AudioDataX = z.infer<typeof audioDataXSchema>;

export const integrationTypes = ["canvas"] as const;
export const allIntegrationTypes = [...integrationTypes];

export const userBasicSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  isInstructor: z.boolean(),
  requestedInstructorAccess: z.boolean(),
  isAdmin: z.boolean(),
});
export type UserBasic = z.infer<typeof userBasicSchema>;
