export function assertOne<T>(array: T[]): T {
  const [item, ...excess] = array;
  if (!item || excess.length > 0) {
    throw new Error(`Expected one item, but got ${array.length}`);
  }
  return item;
}

export function assertOneOrNone<T>(array: T[]): T | null {
  const [item, ...excess] = array;
  if (excess.length > 0) {
    throw new Error(`Expected zero or one items, but got ${array.length}`);
  }
  return item ?? null;
}
