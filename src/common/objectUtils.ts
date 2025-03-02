export function objectEntries<T extends object>(obj: T) {
  return Object.entries(obj) as Array<[keyof T & string, T[keyof T]]>;
}

export function objectKeys<T extends object>(obj: T) {
  return Object.keys(obj) as Array<keyof T & string>;
}

export function objectValues<T extends object>(obj: T) {
  return Object.values(obj) as Array<T[keyof T & string]>;
}

export function identity<T>(x: T) {
  return x;
}

export function safeGet<T extends { [key: string]: unknown }>(
  obj: T,
  key: string,
): T[keyof T] | undefined {
  return obj[key] as T[keyof T] | undefined;
}

/**
 * Safely checks if a readonly array includes a value, with type assertion
 * that the value is a member of the array's element type.
 *
 * @param arr The readonly array to check
 * @param value The value to check for inclusion
 * @returns True if the array includes the value, false otherwise
 */
export function safeIncludes<T extends readonly unknown[]>(
  arr: T,
  value: unknown,
): value is T[number] {
  return arr.includes(value as T[number]);
}
