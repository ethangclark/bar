export function assertTypesExhausted(_: never): asserts _ is never {
  // do nothing; we only want this for type narrowing
  // (if we threw here it would prevent us from passing
  // subtypes as supertypes)
}

export function assertError(e: unknown): asserts e is Error {
  if (!(e instanceof Error)) {
    throw e;
  }
}

// really "asserted AS one"
export function assertOne<T>(array: T[]): T {
  const [item, ...excess] = array;
  if (!item || excess.length > 0) {
    throw new Error(`Expected one item, but got ${array.length}`);
  }
  return item;
}

// really "asserted AS one or none"
export function assertOneOrNone<T>(array: T[]): T | null {
  const [item, ...excess] = array;
  if (excess.length > 0) {
    throw new Error(`Expected zero or one items, but got ${array.length}`);
  }
  return item ?? null;
}

// really "asserted AS non-nullish"
export function assertNotNullish<T>(item: T | null | undefined): T {
  if (item === null || item === undefined) {
    throw new Error("Expected item to be non-nullish");
  }
  return item;
}
