import { createSeedInt } from "./seedInt";

describe(createSeedInt.name, () => {
  it("should return a number", async () => {
    const result = await createSeedInt();
    expect(typeof result).toBe("number");
  });

  it("should return a number between 0 and 999999 inclusive", async () => {
    const result = await createSeedInt();
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(1000000);
  });

  it("should return different values on multiple calls", async () => {
    const results = new Set();
    for (let i = 0; i < 100; i++) {
      results.add(await createSeedInt());
    }
    expect(results.size).toBeGreaterThan(1); // There should be multiple unique values
  });
});
