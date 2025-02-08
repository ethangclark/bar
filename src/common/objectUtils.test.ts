import { objectEntries, surgicalAssignDeep } from "./objectUtils";
import { type Json } from "./types";

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

describe("surgicalAssignDeep", () => {
  it("should return the same primitive if equal", () => {
    expect(surgicalAssignDeep(5, 5)).toBe(5);
    expect(surgicalAssignDeep("hello", "hello")).toBe("hello");
  });

  it("should return the source primitive if different", () => {
    expect(surgicalAssignDeep(5, 10)).toBe(10);
    expect(surgicalAssignDeep("a", "b")).toBe("b");
  });

  it("should update objects deeply without replacing unchanged sub-objects", () => {
    const target: Json = { a: 1, b: { c: 2, d: 3 }, e: 4 };
    const source: Json = { a: 1, b: { c: 20 }, f: 5 };
    // Save original reference for b to ensure it's mutated, not replaced.
    const originalB = (target as { b: Json }).b;

    surgicalAssignDeep(target, source);

    expect(target).toEqual({ a: 1, b: { c: 20 }, f: 5 });
    expect((target as { b: Json }).b).toBe(originalB);
  });

  it("should update arrays deeply without replacing unchanged sub-items", () => {
    const target: Json = [1, { a: 1 }, 3];
    const source: Json = [1, { a: 2 }, 4, 5];
    // Save original object reference at index 1.
    const originalObj = (target as Json[])[1];

    surgicalAssignDeep(target, source);

    expect(target).toEqual([1, { a: 2 }, 4, 5]);
    expect((target as Json[])[1]).toBe(originalObj);
  });

  it("should trim the target array if the source is shorter", () => {
    const target: Json = [1, 2, 3, 4];
    const source: Json = [1, 2];

    surgicalAssignDeep(target, source);

    expect(target).toEqual([1, 2]);
  });

  it("should update nested structures correctly", () => {
    const target: Json = {
      items: [
        { id: 1, value: "a" },
        { id: 2, value: "b" },
      ],
      count: 2,
    };
    const source: Json = {
      items: [
        { id: 1, value: "a" },
        { id: 2, value: "c" },
      ],
      count: 2,
    };
    // Save original reference for the nested object in items.
    const originalItem = (target as { items: Json[] }).items[1];

    surgicalAssignDeep(target, source);

    expect(target).toEqual(source);
    expect((target as { items: Json[] }).items[1]).toBe(originalItem);
  });

  it("should return the source when types differ (object vs array)", () => {
    const target: Json = { a: 1 };
    const source: Json = [1, 2, 3];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = surgicalAssignDeep(target, source as any);

    expect(result).toEqual(source);
  });

  it("should return the source when target is null and source is an object", () => {
    const target: Json = null;
    const source: Json = { a: 1 };

    const result = surgicalAssignDeep(target, source);

    expect(result).toEqual(source);
  });
});
