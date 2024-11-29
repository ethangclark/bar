vi.mock("~/env");
vi.mock("~/server/ai/llm/llmNotTestAsserter");

describe("example prompt test", () => {
  it("passes depsite being only probabilistic", async () => {
    expect(Math.random()).toBeLessThan(0.99999);
  });
});
