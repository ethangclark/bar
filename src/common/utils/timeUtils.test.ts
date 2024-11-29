import { waitForMs } from "./timeUtils";

describe("waitForMs", () => {
  it("should resolve after the specified time", async () => {
    const ms = 50;
    const timeoutSpy = vi.spyOn(global, "setTimeout");

    const start = Date.now();
    await waitForMs(ms);
    const end = Date.now();

    expect(end - start).toBeGreaterThanOrEqual(ms * 0.95); // allow for 5% error (I've seen this fail locally without this.)
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), ms);

    timeoutSpy.mockRestore();
  });
});
