export function identity<T>(x: T) {
  return x;
}

export function objectKeys<T extends object>(obj: T) {
  return Object.keys(obj) as Array<keyof T>;
}

export function objectValues<T extends object>(obj: T) {
  return Object.values(obj) as Array<T[keyof T]>;
}

export function objectEntries<T extends object>(obj: T) {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

export function objectAssign<T extends object>(target: T, source: Partial<T>) {
  Object.assign(target, source);
}

export function safeGet<T extends Record<string, unknown>>(
  obj: T,
  key: string,
): T[keyof T] | undefined {
  return obj[key] as T[keyof T] | undefined;
}
