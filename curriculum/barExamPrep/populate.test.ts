import { getModuleList, getTopics } from "./populate";

describe("populate", () => {
  test("findMissingTopics", () => {
    const modulesStr = getModuleList().sort().join("");
    const topicsStr = getTopics()
      .map((t) => t.module)
      .sort()
      .join("");
    expect(modulesStr).toEqual(topicsStr);
  });
});
