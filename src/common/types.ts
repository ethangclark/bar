import type superjson from "superjson";
import { z } from "zod";

export { type RichActivity } from "~/server/services/activity/activityService";

export type SuperJSONValue = Parameters<typeof superjson.serialize>[0];

export type MaybePromise<T = void> = T | Promise<T>;

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
export type Json = Literal | { [key: string]: Json } | Json[];
export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]),
);

export type JsonPlus =
  | Literal
  | undefined
  | Date
  | JsonPlus[]
  | { [key: string]: JsonPlus };

export const audioDataXSchema = z.object({
  data: z.string(), // base64 encoded audio
  mimeType: z.string(), // audio MIME type
});
// Types for the audio data structure
export type AudioDataX = z.infer<typeof audioDataXSchema>;

export const MessageDeltaSchema = z.object({
  activityId: z.string(),
  messageId: z.string(),
  contentDelta: z.string(),
});
export type MessageDeltaSchema = z.infer<typeof MessageDeltaSchema>;

export const integrationTypes = ["canvas"] as const;
export const allIntegrationTypes = [...integrationTypes];
