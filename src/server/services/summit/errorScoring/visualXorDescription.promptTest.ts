import { getVisualXorDescriptionOk } from "./visualXorDescription";

vi.mock("~/env");
vi.mock("~/server/ai/llm/llmNotTestAsserter");
vi.mock("~/server/db");
vi.mock("~/server/services/userService", () => ({
  getUser: vi.fn().mockResolvedValue({
    llmTokensUsed: 0,
  }),
}));
vi.mock("~/server/services/usageService", () => ({
  incrementUsage: vi.fn(),
  assertUsageOk: vi.fn(),
}));

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

  test("it fails cass where the description is not removed", async () => {
    const result = await getVisualXorDescriptionOk({
      baseMessage: {
        id: "1",
        status: "completeWithViewPieces",
        activityId: "1",
        userId: "1",
        createdAt: new Date(),
        threadId: "1",
        senderRole: "user",
        content: `**Item 9.**

Here's some information about conversion factors:

**Image 1016** (image omitted; description follows)

The image displays an example conversion of milliliters to fluid ounces using dimensional analysis or factor label method. The example shows that to convert 51.9 milliliters to fluid ounces, one must use the following equation:
 "51.9 milliliters x (1 fluid ounce) / (29.6 milliliters) = 1.75 fluid ounces". 
Note that the milliliters cancel out and leave you with the desired unit, fluid ounces. 
The text below the equation states that this method of converting units is called "dimensional analysis" or "factor label method”.

Let me know when you're ready to move on.`,
      },
      mediaInjections: [
        {
          type: "text",
          data: {
            content:
              "Let me show you some information about conversion factors.",
            id: "1",
            activityId: "1",
            userId: "1",
            viewPieceId: "1",
          },
          viewPiece: {
            id: "1",
            activityId: "1",
            userId: "1",
            messageId: "1",
            order: 1,
          },
        },
        {
          type: "image",
          data: {
            id: "1",
            activityId: "1",
            userId: "1",
            viewPieceId: "1",
            infoImageId: "1",
          },
          viewPiece: {
            id: "1",
            activityId: "1",
            userId: "1",
            messageId: "1",
            order: 2,
          },
        },
        {
          type: "text",
          data: {
            id: "1",
            activityId: "1",
            userId: "1",
            content: `The image displays an example conversion of milliliters to fluid ounces using dimensional analysis or factor label method. Note that the milliliters cancel out and leave you with the desired unit, fluid ounces. The text below the equation states that this method of converting units is called "dimensional analysis" or "factor label method”.

Let me know when you're ready to move on.`,
            viewPieceId: "1",
          },
          viewPiece: {
            id: "1",
            activityId: "1",
            userId: "1",
            messageId: "1",
            order: 3,
          },
        },
      ],
    });
    expect(result).toEqual({ ok: false });
  });
});
