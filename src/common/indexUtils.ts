export function indexById<T extends { id: string }>(arr: T[]) {
  return arr.reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as { [key: string]: T },
  );
}
