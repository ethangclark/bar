// src/server/services/summit/mediaInjection/mediaInjectionParser.test.ts
import { parseMediaInjectionResponse } from "./mediaInjectionParser";

describe("parseMediaInjectionResponse", () => {
  it("parses valid string with text, image, and video tags", () => {
    const input =
      "Some preamble <text>Hello, world!</text> in-between <image>1042</image> and <video>2007</video> postamble.";
    const result = parseMediaInjectionResponse(input, [42], [7]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([
        { type: "text", textContent: "Hello, world!" },
        { type: "image", numericId: 42 },
        { type: "video", numericId: 7 },
      ]);
    }
  });

  it("parses valid string with multiple tags of each type", () => {
    const input =
      "<text>First</text><image>1007</image><text>Second</text><video>2003</video><text>Third</text><image>1008</image><video>2004</video>";
    const result = parseMediaInjectionResponse(input, [7, 8], [3, 4]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([
        { type: "text", textContent: "First" },
        { type: "image", numericId: 7 },
        { type: "text", textContent: "Second" },
        { type: "video", numericId: 3 },
        { type: "text", textContent: "Third" },
        { type: "image", numericId: 8 },
        { type: "video", numericId: 4 },
      ]);
    }
  });

  it("handles whitespace in tag content", () => {
    const input =
      "<text>\n  Spaced content  \n</text><image>  1007  </image><video>\n2003\n</video>";
    const result = parseMediaInjectionResponse(input, [7], [3]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([
        { type: "text", textContent: "\n  Spaced content  \n" },
        { type: "image", numericId: 7 },
        { type: "video", numericId: 3 },
      ]);
    }
  });

  it("ignores content outside of tags", () => {
    const input =
      "Random text <text>Inside</text> more random <image>1003</image> extra text <video>2005</video> final text.";
    const result = parseMediaInjectionResponse(input, [3], [5]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([
        { type: "text", textContent: "Inside" },
        { type: "image", numericId: 3 },
        { type: "video", numericId: 5 },
      ]);
    }
  });

  it("returns error when <text> tags are mismatched", () => {
    const input = "Some content <text>Missing closing tag";
    const result = parseMediaInjectionResponse(input, [], []);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("Mismatched <text> tags");
    }
  });

  it("returns error when <image> tags are mismatched", () => {
    const input = "Some content <image>1123</image> and then <image>1456";
    const result = parseMediaInjectionResponse(input, [123], []);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("Mismatched <image> tags");
    }
  });

  it("returns error when <video> tags are mismatched", () => {
    const input = "Some content <video>2123</video> and then <video>2456";
    const result = parseMediaInjectionResponse(input, [], [123]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("Mismatched <video> tags");
    }
  });

  it("returns error when image content is not a valid number", () => {
    const input = "<image>not-a-number</image>";
    const result = parseMediaInjectionResponse(input, [], []);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toMatch(/Invalid image number/);
    }
  });

  it("returns error when video content is not a valid number", () => {
    const input = "<video>not-a-number</video>";
    const result = parseMediaInjectionResponse(input, [], []);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toMatch(/Invalid video number/);
    }
  });

  it("returns an error when an image number is not in the list of possible image ids", () => {
    const input = "<image>1123</image>";
    const result = parseMediaInjectionResponse(input, [456], []);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toMatch(/Invalid image number/);
    }
  });

  it("returns an error when a video number is not in the list of possible video ids", () => {
    const input = "<video>2123</video>";
    const result = parseMediaInjectionResponse(input, [], [456]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toMatch(/Invalid video number/);
    }
  });

  it("correctly handles nested content within text tags", () => {
    const input = "<text>This is <b>bold</b> and <i>italic</i> text</text>";
    const result = parseMediaInjectionResponse(input, [], []);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([
        {
          type: "text",
          textContent: "This is <b>bold</b> and <i>italic</i> text",
        },
      ]);
    }
  });

  it("handles empty tags", () => {
    const input = "<text></text><image>1042</image><video>2007</video>";
    const result = parseMediaInjectionResponse(input, [42], [7]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([
        { type: "text", textContent: "" },
        { type: "image", numericId: 42 },
        { type: "video", numericId: 7 },
      ]);
    }
  });
});
