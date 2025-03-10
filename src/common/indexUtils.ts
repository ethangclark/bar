export function indexById<T extends { id: string }>(arr: T[]) {
  return arr.reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as { [key: string]: T },
  );
}

export function indexToItemNumber(index: number) {
  return index + 1;
}

export function itemNumberToIndex(itemNumber: number) {
  return itemNumber - 1;
}

export function sortByOrderFracIdx<T extends { orderFracIdx: string }>(
  arr: T[],
) {
  return arr.slice().sort((a, b) => (a.orderFracIdx < b.orderFracIdx ? -1 : 1));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function groupBy<T extends { [key: string]: any }, K extends keyof T>(
  arr: T[],
  key: K,
): T[K] extends string ? { [key: string]: T[] } : never {
  const grouped: { [key: string]: T[] } = {};
  for (const item of arr) {
    const kv = item[key];
    if (kv === undefined) {
      throw new Error(`Item value for key ${String(key)} is undefined`);
    }
    const group = grouped[kv] ?? [];
    group.push(item);
    grouped[kv] = group;
  }
  return grouped as T[K] extends string ? { [key: string]: T[] } : never;
}
