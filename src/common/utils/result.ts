import { assertError } from "./errorUtils";
import { isSentence, type MaybePromise, type Sentence } from "./types";

export type Problem = Sentence;

export const failureType = {
  badAiResponse: "badAiResponse",
  badXml: "badXml",
} as const;
type FailureTypeMap = typeof failureType;
type FailureType = FailureTypeMap[keyof FailureTypeMap];

export type Failure = {
  problem: Problem;
  type?: FailureType;
  error?: Error; // just for the stack trace
  data?: unknown;
};

export type Result<T> = T | Failure;

export function failure(
  problem: Problem,
  type?: FailureType,
  data?: unknown,
): Failure {
  return {
    problem,
    type,
    error: Error(problem), // just for the stack trace
    data,
  } satisfies Result<unknown>;
}

export const _errorToProblem = (
  error: unknown,
  additionalDetail = "",
): Problem => {
  assertError(error);
  return `An error was encountered. ${additionalDetail} Error: "${error.name}".`;
};

export const errorToFailure = (
  error: unknown,
  additionalDetail = "",
): Failure => {
  assertError(error);
  return {
    problem: _errorToProblem(error, additionalDetail),
    error,
  };
};

export function isFailure(value: unknown): value is Failure {
  return (
    typeof value === "object" &&
    value !== null &&
    "problem" in value &&
    isSentence(value.problem)
  );
}

export function isNotFailure<T>(value: Result<T>): value is T {
  return !isFailure(value);
}

export function assertIsFailure(value: unknown): asserts value is Failure {
  if (!isFailure(value)) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw Error(`Expected a failure, but got: ${value}`);
  }
}

export function assertIsNotFailure<T>(value: Result<T>): asserts value is T {
  if (isFailure(value)) {
    throw Error(`Expected not to be a failure, but got: ${value.problem}`);
  }
}

export function wrapFailure(whereFailureEncountered: string, failure: Failure) {
  return {
    ...failure,
    problem: `In ${whereFailureEncountered}: ${failure.problem}`,
  };
}

export function asSuccessOrNull<T>(value: Result<T>): T | null {
  return isFailure(value) ? null : value;
}

export async function tryRepeatedly<T>({
  fn,
  onFail,
  upToTimes,
}: {
  fn: () => MaybePromise<Result<T>>;
  onFail: (failure: Failure) => MaybePromise<void>;
  upToTimes: number;
}): Promise<Result<T>> {
  let currentTry = 0;
  while (true) {
    currentTry++;
    const result = await fn();
    if (isFailure(result)) {
      await onFail(result);
      if (currentTry >= upToTimes) {
        return result;
      }
      continue;
    }
    return result;
  }
}
