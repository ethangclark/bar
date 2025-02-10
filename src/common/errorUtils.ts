export function assertNever(_: never): never {
  throw new Error(`Unexpected value should never be reached`);
}

export function assertError(e: unknown): asserts e is Error {
  if (!(e instanceof Error)) {
    throw e;
  }
}
