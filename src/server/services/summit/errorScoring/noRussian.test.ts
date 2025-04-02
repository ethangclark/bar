import { getLackOfRussianOk } from "./noRussian";

describe(getLackOfRussianOk.name, () => {
  it("returns true if the message does not contain Russian characters", () => {
    const result = getLackOfRussianOk({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      baseMessage: { content: "Hello, world!" } as any,
      mediaInjections: [],
    });
    expect(result.ok).toBe(true);
  });
  it("returns false if the message does contain Russian characters", () => {
    const result = getLackOfRussianOk({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      baseMessage: { content: "Привет, мир!" } as any,
      mediaInjections: [],
    });
    expect(result.ok).toBe(false);
  });
});
