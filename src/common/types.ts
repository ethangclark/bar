import { z } from "zod";
import type { Activity } from "~/server/db/schema";
import type { LmsCourse, LmsAssignment } from "~/server/integrations/types";
import superjson from "superjson";

export type SuperJSONValue = Parameters<typeof superjson.serialize>[0];

export type MaybePromise<T = void> = T | Promise<T>;

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
export type Json = Literal | { [key: string]: Json } | Json[];
export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]),
);

export type JsonOrUndefined =
  | Literal
  | undefined
  | JsonOrUndefined[]
  | { [key: string]: JsonOrUndefined };

export const audioDataXSchema = z.object({
  data: z.string(), // base64 encoded audio
  timestamp: z.string(), // ISO string timestamp
  mimeType: z.string(), // audio MIME type
});
// Types for the audio data structure
export type AudioDataX = z.infer<typeof audioDataXSchema>;

export const MessageDeltaItemSchema = z.union([
  z.object({
    done: z.literal(false),
    delta: z.string(),
  }),
  z.object({
    done: z.literal(true),
  }),
]);
export type MessageDeltaItem = z.infer<typeof MessageDeltaItemSchema>;

export type RichActivity = Activity & {
  course: LmsCourse;
  assignment: LmsAssignment;
};
