import { z } from "zod";

export type Sentence = `${string}.`;
export function isSentence(value: unknown): value is Sentence {
  return typeof value === "string" && value.endsWith(".");
}

export type Question = `${string}?`;

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

export const audioDataSchema = z.object({
  data: z.string(), // base64 encoded audio
  timestamp: z.string(), // ISO string timestamp
  mimeType: z.string(), // audio MIME type
});
// Types for the audio data structure
export type AudioData = z.infer<typeof audioDataSchema>;

export const identity = <T>(x: T) => x;
