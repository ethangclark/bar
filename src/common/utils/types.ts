import { z } from "zod";

export type Sentence = `${string}.`;
export function isSentence(value: unknown): value is Sentence {
  return typeof value === "string" && value.endsWith(".");
}

export type Question = `${string}?`;

export type MaybePromise<T = void> = T | Promise<T>;

export type JsonOrUndefined =
  | undefined
  | null
  | boolean
  | number
  | string
  | JsonOrUndefined[]
  | { [key: string]: JsonOrUndefined };

export type EnsureSubtype<T extends U, U> = T;

export type NonEmptyArray<T> = [T, ...T[]];
export function isNonEmptyArray<T>(value: unknown): value is NonEmptyArray<T> {
  return Array.isArray(value) && value.length > 0;
}
export function assertIsNonEmptyArray<T>(
  value: T[],
): asserts value is NonEmptyArray<T> {
  if (!isNonEmptyArray(value)) {
    throw new Error("Expected a non-empty array");
  }
}

export const audioDataSchema = z.object({
  data: z.string(), // base64 encoded audio
  timestamp: z.string(), // ISO string timestamp
  mimeType: z.string(), // audio MIME type
});
// Types for the audio data structure
export type AudioData = z.infer<typeof audioDataSchema>;
