import { getVisualXorDescriptionOk } from "./visualXorDescription";

vi.mock("~/env");
vi.mock("~/server/ai/llm/llmNotTestAsserter");

describe(getVisualXorDescriptionOk.name, () => {
  test("it is fine when there are no media injections", async () => {
    const result = await getVisualXorDescriptionOk({
      baseMessage: {
        id: "1",
        status: "completeWithViewPieces",
        activityId: "1",
        userId: "1",
        createdAt: new Date(),
        threadId: "1",
        senderRole: "user",
        content: "Hello, world!",
      },
      mediaInjections: [],
    });
    expect(result).toEqual({ ok: true });
  });
});
