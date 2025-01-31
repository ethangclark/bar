import { type z } from "zod";

export function isNullish<T>(
  value: T | null | undefined,
): value is null | undefined {
  return value === null || value === undefined;
}
export function isNonNullish<T>(value: T): value is NonNullable<T> {
  return !isNullish(value);
}
export const isNotNullish = isNonNullish;

export const noop = <T>(_?: T) => void 0;

export function filter<T, U extends T>(
  array: T[],
  schema: z.ZodType<U> | ((v: T) => v is U),
): U[] {
  if (typeof schema === "function") {
    return array.filter(schema);
  }
  return array.filter((item) => schema.safeParse(item).success) as U[];
}

export function invoke<T>(fn: () => T): T {
  return fn();
}

export function asserted<T>(value: T | null | undefined): T {
  if (isNullish(value)) {
    throw new Error("Assertion failed");
  }
  return value;
}
