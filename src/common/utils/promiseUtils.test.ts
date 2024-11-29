import { splitPromise } from "./promiseUtils";
import { ShouldNeverHappen } from "./errorUtils";
import { noop } from "./fnUtils";

describe("splitPromise", () => {
  it("should return an object with resolve, reject, and promise", () => {
    const { resolve, reject, promise } = splitPromise<string>();
    expect(typeof resolve).toBe("function");
    expect(typeof reject).toBe("function");
    expect(promise).toBeInstanceOf(Promise);
  });

  it("should resolve the promise with the correct value", async () => {
    const { resolve, promise } = splitPromise<string>();
    resolve("resolved value");
    await expect(promise).resolves.toBe("resolved value");
  });

  it("should reject the promise with the correct error", async () => {
    const { reject, promise } = splitPromise<string>();
    const error = new Error("rejected value");
    reject(error);
    await expect(promise).rejects.toThrow("rejected value");
  });

  it("should throw ShouldNeverHappen error if resolve or reject is not defined", () => {
    // To test this, we need to simulate the case where resolve or reject is not assigned.
    // This is tricky since the current implementation does not allow it.
    // For the sake of completeness, let's assume there's a way to simulate it.
    const originalPromise = global.Promise;
    global.Promise = function (executor: (resolve: () => void) => void) {
      executor(noop /* second arg not defined */);
    } as unknown as PromiseConstructor;

    expect(() => splitPromise<string>()).toThrow(ShouldNeverHappen);

    global.Promise = originalPromise;
  });
});
