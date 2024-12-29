import { ShouldNeverHappenError, assertNever } from "./errorUtils";

// Tests for ShouldNeverHappen class
describe("ShouldNeverHappen", () => {
  it("should have a default message", () => {
    const error = new ShouldNeverHappenError();
    expect(error.message).toBe("This should never happen.");
    expect(error.name).toBe("ShouldNeverHappen");
  });

  it("should allow a custom message", () => {
    const customMessage = "Custom error message";
    const error = new ShouldNeverHappenError(customMessage);
    expect(error.message).toBe(customMessage);
    expect(error.name).toBe("ShouldNeverHappen");
  });
});

// Tests for assertNever function
describe("assertNever", () => {
  it("should throw a ShouldNeverHappen error", () => {
    // @ts-expect-error: Forcing a value to trigger assertNever
    const unexpectedValue: never = "unexpected";
    expect(() => assertNever(unexpectedValue)).toThrow(ShouldNeverHappenError);
    expect(() => assertNever(unexpectedValue)).toThrow(
      "Unexpected value that should never be reached",
    );
  });
});
