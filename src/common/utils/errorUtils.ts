export function assertError(error: unknown): asserts error is Error {
  if (!(error instanceof Error)) {
    throw error;
  }
}

export class ShouldNeverHappen extends Error {
  constructor(message = "This should never happen.") {
    super(message);
    this.name = "ShouldNeverHappen";
  }
}

export function assertNever(_: never): never {
  throw new ShouldNeverHappen(`Unexpected value that should never be reached`);
}
