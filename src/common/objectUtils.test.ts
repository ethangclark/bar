import { objectEntries } from "./objectUtils";

describe("objectEntries", () => {
  it("should return an array of key-value pairs for a given object", () => {
    const obj = { a: 1, b: "test", c: true };
    const result = objectEntries(obj);

    expect(result).toEqual([
      ["a", 1],
      ["b", "test"],
      ["c", true],
    ]);
  });

  it("should work with objects with different types of values", () => {
    const obj = {
      a: 1,
      b: "string",
      c: true,
      d: null,
      e: undefined,
      f: [1, 2, 3],
    };
    const result = objectEntries(obj);

    expect(result).toEqual([
      ["a", 1],
      ["b", "string"],
      ["c", true],
      ["d", null],
      ["e", undefined],
      ["f", [1, 2, 3]],
    ]);
  });

  it("should return an empty array for an empty object", () => {
    const obj = {};
    const result = objectEntries(obj);

    expect(result).toEqual([]);
  });
});
