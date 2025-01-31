export class ShouldNeverHappenError extends Error {
  constructor(message = "This should never happen.") {
    super(message);
    this.name = "ShouldNeverHappen";
  }
}

export function assertNever(_: never): never {
  throw new ShouldNeverHappenError(
    `Unexpected value that should never be reached`,
  );
}

export function assertError(e: unknown): asserts e is Error {
  if (!(e instanceof Error)) {
    throw e;
  }
}
