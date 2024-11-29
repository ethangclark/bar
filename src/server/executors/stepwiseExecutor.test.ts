import { initializeStepwiseExecutor } from "./stepwiseExecutor";

describe(initializeStepwiseExecutor.name, () => {
  it("respects values passed in params", async () => {
    const valueContainer = { value: 0 };
    const increment = () => valueContainer.value++;
    const output = { value: 0 };
    await initializeStepwiseExecutor(
      { valueContainer, increment, output },
      "increment(); output.value = valueContainer.value;",
    );
    expect(valueContainer.value).toEqual(1);
  });
  it("allows steps to reference variables created in initial step", async () => {
    const output = { value: 0 };
    const executor = await initializeStepwiseExecutor(
      { output },
      "const foo = 123",
    );
    await executor.exec("output.value = foo;");
    expect(output.value).toEqual(123);
  });
  it("allows steps to reference variables created in previous steps", async () => {
    const output = { value: 0 };
    const executor = await initializeStepwiseExecutor(
      { output },
      "const foo = 123",
    );
    await executor.exec("const bar = foo;");
    await executor.exec("output.value = bar;");
    expect(output.value).toEqual(123);
  });
});
