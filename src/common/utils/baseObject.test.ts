import { baseObject } from "./baseObject";

describe("baseObject", () => {
  it("should have a base property set to true", () => {
    expect(baseObject).toHaveProperty("base", true);
  });
});
