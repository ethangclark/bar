import { z } from "zod";
import { isNullish, isNonNullish, isNotNullish, noop, filter } from "./fnUtils";

describe("isNullish", () => {
  it("should return true for null or undefined", () => {
    expect(isNullish(null)).toBe(true);
    expect(isNullish(undefined)).toBe(true);
  });

  it("should return false for non-nullish values", () => {
    expect(isNullish(0)).toBe(false);
    expect(isNullish("")).toBe(false);
    expect(isNullish(false)).toBe(false);
    expect(isNullish([])).toBe(false);
    expect(isNullish({})).toBe(false);
  });
});

describe("isNonNullish", () => {
  it("should return false for null or undefined", () => {
    expect(isNonNullish(null)).toBe(false);
    expect(isNonNullish(undefined)).toBe(false);
  });

  it("should return true for non-nullish values", () => {
    expect(isNonNullish(0)).toBe(true);
    expect(isNonNullish("")).toBe(true);
    expect(isNonNullish(false)).toBe(true);
    expect(isNonNullish([])).toBe(true);
    expect(isNonNullish({})).toBe(true);
  });
});

describe("isNotNullish", () => {
  it("should be the same as isNonNullish", () => {
    expect(isNotNullish).toBe(isNonNullish);
  });
});

describe("noop", () => {
  it("should do nothing", () => {
    expect(noop()).toBe(undefined);
    expect(noop(123)).toBe(undefined);
    expect(noop("test")).toBe(undefined);
  });
});

describe("filter", () => {
  it("should filter using a function predicate", () => {
    const array = [1, 2, 3, 4, 5];
    const isEven = (num: number): num is number => num % 2 === 0;
    expect(filter(array, isEven)).toEqual([2, 4]);
  });

  it("should filter using a zod schema", () => {
    const array = [1, "two", 3, "four", 5];
    const numberSchema = z.number();
    expect(filter(array, numberSchema)).toEqual([1, 3, 5]);
  });

  it("should return an empty array if no items match the schema", () => {
    const array = ["one", "two", "three"];
    const numberSchema = z.number();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(filter(array, numberSchema as any)).toEqual([]);
  });
});
