export function objectEntries<T extends object>(obj: T) {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

export function safeGet<T extends Record<string, unknown>>(
  obj: T,
  key: string,
): T[keyof T] | undefined {
  return obj[key] as T[keyof T] | undefined;
}
