import { assertError, ShouldNeverHappen, assertNever } from "./errorUtils";

// Tests for assertError function
describe("assertError", () => {
  it("should not throw an error when given an Error instance", () => {
    const error = new Error("Test error");
    expect(() => assertError(error)).not.toThrow();
  });

  it("should throw an error when given a non-Error instance", () => {
    const nonError = "This is not an error";
    expect(() => assertError(nonError)).toThrow(nonError);
  });
});

// Tests for ShouldNeverHappen class
describe("ShouldNeverHappen", () => {
  it("should have a default message", () => {
    const error = new ShouldNeverHappen();
    expect(error.message).toBe("This should never happen.");
    expect(error.name).toBe("ShouldNeverHappen");
  });

  it("should allow a custom message", () => {
    const customMessage = "Custom error message";
    const error = new ShouldNeverHappen(customMessage);
    expect(error.message).toBe(customMessage);
    expect(error.name).toBe("ShouldNeverHappen");
  });
});

// Tests for assertNever function
describe("assertNever", () => {
  it("should throw a ShouldNeverHappen error", () => {
    // @ts-expect-error: Forcing a value to trigger assertNever
    const unexpectedValue: never = "unexpected";
    expect(() => assertNever(unexpectedValue)).toThrow(ShouldNeverHappen);
    expect(() => assertNever(unexpectedValue)).toThrow(
      "Unexpected value that should never be reached",
    );
  });
});
