import { vi } from "vitest";
import {
  failureType,
  failure,
  errorToProblem,
  errorToFailure,
  isFailure,
  type Failure,
  type Problem,
  tryRepeatedly,
} from "./result";

describe("failure function", () => {
  it("should create a Failure object with given problem and type", () => {
    const problem: Problem = "This is a problem.";
    const type = failureType.badAiResponse;
    const result = failure(problem, type);

    expect(result).toEqual({
      problem,
      type,
      error: new Error(problem),
      data: undefined,
    });
  });

  it("should create a Failure object with given problem, type, and data", () => {
    const problem: Problem = "This is a problem.";
    const type = failureType.badAiResponse;
    const data = { key: "value" };
    const result = failure(problem, type, data);

    expect(result).toEqual({
      problem,
      type,
      error: new Error(problem),
      data,
    });
  });
});

describe("tryRepeatedly function", () => {
  it("should return success result on first try", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const onFail = vi.fn();

    const result = await tryRepeatedly({
      fn,
      onFail,
      upToTimes: 3,
    });

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(onFail).not.toHaveBeenCalled();
  });

  it("should retry on failure and return success", async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce(failure("Error 1."))
      .mockResolvedValueOnce(failure("Error 2."))
      .mockResolvedValue("success");
    const onFail = vi.fn();

    const result = await tryRepeatedly({
      fn,
      onFail,
      upToTimes: 3,
    });

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onFail).toHaveBeenCalledTimes(2);
  });

  it("should return failure after exhausting all attempts", async () => {
    const failureResult = failure("Persistent error.");
    const fn = vi.fn().mockResolvedValue(failureResult);
    const onFail = vi.fn();

    const result = await tryRepeatedly({
      fn,
      onFail,
      upToTimes: 3,
    });

    expect(result).toBe(failureResult);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onFail).toHaveBeenCalledTimes(3);
  });
});

describe("errorToProblem function", () => {
  it("should convert an error to a Problem string", () => {
    const error = new Error("Test error");
    const result = errorToProblem(error);

    expect(result).toBe('An error was encountered.  Error: "Error".');
  });
});

describe("errorToFailure function", () => {
  it("should convert an error to a Failure object", () => {
    const error = new Error("Test error");
    const result = errorToFailure(error);

    expect(result).toEqual({
      problem: 'An error was encountered.  Error: "Error".',
      error,
    });
  });
});

describe("isFailure function", () => {
  it("should return true for a valid Failure object", () => {
    const failureObj: Failure = {
      problem: "This is a problem.",
      type: failureType.badAiResponse,
      error: new Error("This is a problem"),
      data: undefined,
    };

    expect(isFailure(failureObj)).toBe(true);
  });

  it("should return false for an invalid Failure object", () => {
    const invalidFailure = {
      problem: "This is a problem",
      error: new Error("This is a problem"),
    };

    expect(isFailure(invalidFailure)).toBe(false);
  });

  it("should return false for non-object values", () => {
    expect(isFailure(null)).toBe(false);
    expect(isFailure("string")).toBe(false);
    expect(isFailure(123)).toBe(false);
  });
});
