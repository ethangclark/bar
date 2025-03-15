import { searchParamsX } from "./searchParams";

describe("searchParamsX", () => {
  it("should have unique keys", () => {
    const keys = Object.values(searchParamsX).map((param) => param.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});
