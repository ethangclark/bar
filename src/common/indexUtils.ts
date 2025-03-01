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
