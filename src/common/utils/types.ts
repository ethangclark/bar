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
