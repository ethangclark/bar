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

  test("it fails cass where the description is not removed (image)", async () => {
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
The text below the equation states that this method of converting units is called "dimensional analysis" or "factor label method".

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
            content: `The image displays an example conversion of milliliters to fluid ounces using dimensional analysis or factor label method. Note that the milliliters cancel out and leave you with the desired unit, fluid ounces. The text below the equation states that this method of converting units is called "dimensional analysis" or "factor label method".

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

  test("it succeeds when the description is removed (image)", async () => {
    const result = await getVisualXorDescriptionOk({
      baseMessage: {
        id: "1",
        status: "completeWithViewPieces",
        activityId: "1",
        userId: "1",
        createdAt: new Date(),
        threadId: "1",
        senderRole: "user",
        content: `Great. We'll start with item 1. Here's Image 1004:

Let me know when you're ready to move on to item 2.`,
      },
      mediaInjections: [
        {
          type: "text",
          data: {
            content: "Great. We'll start with item 1. Here's Image 1004:",
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
            id: "2",
            activityId: "1",
            userId: "1",
            viewPieceId: "2",
            infoImageId: "1004",
          },
          viewPiece: {
            id: "2",
            activityId: "1",
            userId: "1",
            messageId: "1",
            order: 2,
          },
        },
        {
          type: "text",
          data: {
            id: "3",
            activityId: "1",
            userId: "1",
            content: "Let me know when you're ready to move on to item 2.",
            viewPieceId: "3",
          },
          viewPiece: {
            id: "3",
            activityId: "1",
            userId: "1",
            messageId: "1",
            order: 3,
          },
        },
      ],
    });
    expect(result).toEqual({ ok: true });
  });

  test("it fails when description is not removed (video)", async () => {
    const result = await getVisualXorDescriptionOk({
      baseMessage: {
        id: "1",
        status: "completeWithViewPieces",
        activityId: "1",
        userId: "1",
        createdAt: new Date(),
        threadId: "1",
        senderRole: "user",
        content: `Great! We'll start with Video 2017.

**Video 2017** (video omitted; description follows)

Every measurement or quantity has a number and a unit. Let me give you two examples. Three cars would be one example, 64.3 kilograms would be another. The three and the 64.3, the numbers indicate how many or how much. The cars and the kilograms, the units, indicate what of. Both are required, a number and a unit, to indicate a measurement or quantity. These measurements or quantities will be represented in standard notation or scientific notation. Scientific notation is also known as exponential notation. Standard notation is used to represent or express relatively small numbers. Kind of think of these as your everyday numbers. For example, 15, 328, 0.52. Scientific notation is used to express numbers in powers of 10. It's commonly used to express very large numbers or very small numbers. Commonly used in chemistry. So let's look at this powers of 10. 10 to the third, where 3 is the exponent, indicates the number of factors of 10. 10 to the third indicates 10 times 10 times 10, which is equal to 1000. 10 to the minus 3 is equal to 0.001, but you can also get it this way. It's 1 divided by 10 times 10 times 10, so the negative puts the number of factors of 10 on the bottom or in the denominator.

Let me know when you're ready to move on to the next item!`,
      },
      mediaInjections: [
        {
          type: "text",
          data: {
            content: "Great! We'll start with Video 2017.",
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
          type: "video",
          data: {
            id: "1",
            activityId: "1",
            userId: "1",
            viewPieceId: "2",
            infoVideoId: "2017",
          },
          viewPiece: {
            id: "2",
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
            content: `Every measurement or quantity has a number and a unit. Let me give you two examples. Three cars would be one example, 64.3 kilograms would be another. The three and the 64.3, the numbers indicate how many or how much. The cars and the kilograms, the units, indicate what of. Both are required, a number and a unit, to indicate a measurement or quantity. These measurements or quantities will be represented in standard notation or scientific notation. Scientific notation is also known as exponential notation. Standard notation is used to represent or express relatively small numbers. Kind of think of these as your everyday numbers. For example, 15, 328, 0.52. Scientific notation is used to express numbers in powers of 10. It's commonly used to express very large numbers or very small numbers. Commonly used in chemistry. So let's look at this powers of 10. 10 to the third, where 3 is the exponent, indicates the number of factors of 10. 10 to the third indicates 10 times 10 times 10, which is equal to 1000. 10 to the minus 3 is equal to 0.001, but you can also get it this way. It's 1 divided by 10 times 10 times 10, so the negative puts the number of factors of 10 on the bottom or in the denominator.

Let me know when you're ready to move on to the next item!`,
            viewPieceId: "3",
          },
          viewPiece: {
            id: "3",
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

  describe("it succeeds when the description is removed (video)", () => {
    test("it passes when video description is properly removed", async () => {
      const result = await getVisualXorDescriptionOk({
        baseMessage: {
          id: "1",
          status: "completeWithViewPieces",
          activityId: "1",
          userId: "1",
          createdAt: new Date(),
          threadId: "1",
          senderRole: "user",
          content: `Let's take a look at video 2018, which goes over scientific notation:

Let me know when you're ready for the next item.`,
        },
        mediaInjections: [
          {
            type: "text",
            data: {
              content:
                "Let's take a look at video 2018, which goes over scientific notation:",
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
            type: "video",
            data: {
              id: "1",
              activityId: "1",
              userId: "1",
              viewPieceId: "2",
              infoVideoId: "2018",
            },
            viewPiece: {
              id: "2",
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
              content: "Let me know when you're ready for the next item.",
              viewPieceId: "3",
            },
            viewPiece: {
              id: "3",
              activityId: "1",
              userId: "1",
              messageId: "1",
              order: 3,
            },
          },
        ],
      });
      expect(result).toEqual({ ok: true });
    });
  });
});
