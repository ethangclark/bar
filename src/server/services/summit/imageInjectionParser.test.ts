import { parseImageInjectionResponse } from "./imageInjectionParser";

describe("parseImageInjectionResponse", () => {
  it("parses valid string with both text and image tags", () => {
    const input =
      "Some preamble <text>Hello, world!</text> in-between <image>42</image> postamble.";
    const result = parseImageInjectionResponse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([
        { type: "text", textContent: "Hello, world!" },
        { type: "image", imageNumber: 42 },
      ]);
    }
  });

  it("parses valid string with multiple tags", () => {
    const input =
      "<text>First</text><image>  7  </image><text>Second</text><image>8</image>";
    const result = parseImageInjectionResponse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([
        { type: "text", textContent: "First" },
        { type: "image", imageNumber: 7 },
        { type: "text", textContent: "Second" },
        { type: "image", imageNumber: 8 },
      ]);
    }
  });

  it("ignores content outside of tags", () => {
    const input =
      "Random text <text>Inside</text> more random <image>10</image> extra text.";
    const result = parseImageInjectionResponse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([
        { type: "text", textContent: "Inside" },
        { type: "image", imageNumber: 10 },
      ]);
    }
  });

  it("returns error when <text> tags are mismatched", () => {
    const input = "Some content <text>Missing closing tag";
    const result = parseImageInjectionResponse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("Mismatched <text> tags");
    }
  });

  it("returns error when <image> tags are mismatched", () => {
    const input = "Some content <image>123</image> and then <image>456";
    const result = parseImageInjectionResponse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("Mismatched <image> tags");
    }
  });

  it("returns error when image content is not a valid number", () => {
    const input = "<image>not-a-number</image>";
    const result = parseImageInjectionResponse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toMatch(/Invalid image number/);
    }
  });
});
