import { findFirstNumber, findJsonArray } from "./stringUtils";
import { z } from "zod";
import { assertIsFailure, assertIsNotFailure } from "./result";

describe("findFirstNumber", () => {
  it("should return the first number in a string", () => {
    expect(findFirstNumber("The number is 123 in the string")).toBe(123);
  });

  it("should return null if no number is found", () => {
    expect(findFirstNumber("There are no numbers here")).toBeNull();
  });

  it("should return the first number when multiple numbers are present", () => {
    expect(findFirstNumber("First number is 42, then comes 100")).toBe(42);
  });

  it("should return null for an empty string", () => {
    expect(findFirstNumber("")).toBeNull();
  });

  it("should handle strings with leading and trailing spaces", () => {
    expect(findFirstNumber("   789 is the number   ")).toBe(789);
  });

  it("should handle strings with special characters and numbers", () => {
    expect(findFirstNumber("Look at this: #1 is the winner!")).toBe(1);
  });

  it("should return the first number when numbers are in scientific notation", () => {
    expect(findFirstNumber("The number is 1e10 in scientific notation")).toBe(
      1,
    );
  });
});

describe("findJsonArray", () => {
  const testSchema = z.object({
    id: z.number(),
    name: z.string(),
  });

  it("should parse a valid JSON array", () => {
    const input =
      'Some text [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}] more text';
    const result = findJsonArray(input, testSchema);
    assertIsNotFailure(result);
    expect(result).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
  });

  it("should return a failure when no JSON array is found", () => {
    const input = "No JSON array here";
    const result = findJsonArray(input, testSchema);
    assertIsFailure(result);
    expect(result.problem).toEqual("No singular JSON array found.");
  });

  it("should return a failure when JSON is invalid", () => {
    const input =
      'Invalid JSON [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob}]';
    const result = findJsonArray(input, testSchema);
    assertIsFailure(result);
    expect(result.problem).toEqual("Could not parse JSON array.");
  });

  it("should return a failure when schema validation fails", () => {
    const input = '[{"id": "not a number", "name": "Alice"}]';
    const result = findJsonArray(input, testSchema);
    assertIsFailure(result);
    expect(result.problem).toEqual("Could not parse JSON array.");
  });

  it("should handle an empty array", () => {
    const input = "Empty array []";
    const result = findJsonArray(input, testSchema);
    assertIsNotFailure(result);
    expect(result).toEqual([]);
  });

  it("should handle arrays with a single item", () => {
    const input = '[{"id": 1, "name": "Alice"}]';
    const result = findJsonArray(input, testSchema);
    assertIsNotFailure(result);
    expect(result).toEqual([{ id: 1, name: "Alice" }]);
  });

  it("should error when string contiains multiple arrays", () => {
    const input =
      'Multiple arrays [{"id": 1, "name": "Alice"}] [{"id": 2, "name": "Bob"}]';
    const result = findJsonArray(input, testSchema);
    assertIsFailure(result);
    expect(result.problem).toEqual("No singular JSON array found.");
  });
});
