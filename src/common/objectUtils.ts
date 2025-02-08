import { type Json } from "./types";

export function objectEntries<T extends object>(obj: T) {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

export function objectKeys<T extends object>(obj: T) {
  return Object.keys(obj) as Array<keyof T>;
}

export function objectValues<T extends object>(obj: T) {
  return Object.values(obj) as Array<T[keyof T]>;
}

export function identity<T>(x: T) {
  return x;
}

export function safeGet<T extends Record<string, unknown>>(
  obj: T,
  key: string,
): T[keyof T] | undefined {
  return obj[key] as T[keyof T] | undefined;
}

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
function isComplex(value: Json): value is { [key: string]: Json } | Json[] {
  return value !== null && typeof value === "object";
}

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
function isPlainObject(value: Json): value is { [key: string]: Json } {
  return isComplex(value) && !Array.isArray(value);
}

export function surgicalAssignDeep<T extends Json>(target: T, source: T): T {
  // If they are exactly equal (or both primitives with same value), do nothing.
  if (target === source) return target;

  // Handle arrays by mutating the target array in place.
  if (Array.isArray(target) && Array.isArray(source)) {
    const minLen = Math.min(target.length, source.length);
    // Update common indices.
    for (let i = 0; i < minLen; i++) {
      const tgtItem = target[i];
      const srcItem = source[i];
      if (tgtItem === undefined || srcItem === undefined) {
        throw new Error("Cannot assign undefined");
      }
      if (isComplex(tgtItem) && isComplex(srcItem)) {
        surgicalAssignDeep(tgtItem, srcItem);
      } else if (tgtItem !== srcItem) {
        target[i] = srcItem;
      }
    }
    // If the source array is shorter, remove extra items from target.
    if (target.length > source.length) {
      target.splice(source.length, target.length - source.length);
    }
    // If the source array is longer, push the new items.
    else if (source.length > target.length) {
      for (let i = target.length; i < source.length; i++) {
        const srcItem = source[i];
        if (srcItem === undefined) {
          throw new Error("Cannot assign undefined");
        }
        target.push(srcItem);
      }
    }
    return target;
  }

  // Handle plain objects by mutating the target object in place.
  if (isPlainObject(target) && isPlainObject(source)) {
    // Remove keys from target that no longer exist in source.
    for (const key in target) {
      if (!(key in source)) {
        delete target[key];
      }
    }
    // For keys in source, update or add them.
    for (const key in source) {
      const srcItem = source[key];
      if (srcItem === undefined) {
        throw new Error("Cannot assign undefined");
      }
      if (key in target) {
        const tgtItem = target[key];
        if (tgtItem === undefined) {
          throw new Error("Cannot assign undefined");
        }
        if (isComplex(tgtItem) && isComplex(srcItem)) {
          surgicalAssignDeep(tgtItem, srcItem);
        } else if (tgtItem !== srcItem) {
          target[key] = srcItem;
        }
      } else {
        target[key] = srcItem;
      }
    }
    return target;
  }

  // If types differ or at least one is a primitive, we cannot “mutate” target.
  // In that case, the caller should replace target with source.
  return source;
}
