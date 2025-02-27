// src/server/services/summit/mediaInjection/mediaInjectionParser.test.ts
import { parseMediaInjectionResponse } from "./mediaInjectionParser";

describe("parseMediaInjectionResponse", () => {
  it("returns empty array when input contains <no-media> tag", () => {
    const input =
      "This text has <image>1042</image> but also has <no-media> so it should return empty array";
    const result = parseMediaInjectionResponse(input, [42], [7]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it("parses valid string with text, image, and video tags", () => {
    const input =
      "Some preamble Hello, world! in-between <image>1042</image> and <video>2007</video> postamble.";
    const result = parseMediaInjectionResponse(input, [42], [7]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([
        {
          type: "text",
          textContent: "Some preamble Hello, world! in-between ",
        },
        { type: "image", numericId: 42 },
        { type: "text", textContent: " and " },
        { type: "video", numericId: 7 },
        { type: "text", textContent: " postamble." },
      ]);
    }
  });

  it("parses valid string with multiple tags", () => {
    const input =
      "First<image>1007</image>Second<video>2003</video>Third<image>1008</image><video>2004</video>";
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
      "Spaced content<image>  1007  </image><video>\n2003\n</video>";
    const result = parseMediaInjectionResponse(input, [7], [3]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([
        { type: "text", textContent: "Spaced content" },
        { type: "image", numericId: 7 },
        { type: "video", numericId: 3 },
      ]);
    }
  });

  it("treats content outside of tags as text", () => {
    const input =
      "Random text before <image>1003</image> text in the middle <video>2005</video> final text.";
    const result = parseMediaInjectionResponse(input, [3], [5]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([
        { type: "text", textContent: "Random text before " },
        { type: "image", numericId: 3 },
        { type: "text", textContent: " text in the middle " },
        { type: "video", numericId: 5 },
        { type: "text", textContent: " final text." },
      ]);
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
    const input = "Text before <image>not-a-number</image> text after";
    const result = parseMediaInjectionResponse(input, [], []);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toMatch(/Invalid image number/);
    }
  });

  it("returns error when video content is not a valid number", () => {
    const input = "Text before <video>not-a-number</video> text after";
    const result = parseMediaInjectionResponse(input, [], []);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toMatch(/Invalid video number/);
    }
  });

  it("returns an error when an image number is not in the list of possible image ids", () => {
    const input = "Text before <image>1123</image> text after";
    const result = parseMediaInjectionResponse(input, [456], []);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toMatch(/Invalid image number/);
    }
  });

  it("returns an error when a video number is not in the list of possible video ids", () => {
    const input = "Text before <video>2123</video> text after";
    const result = parseMediaInjectionResponse(input, [], [456]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toMatch(/Invalid video number/);
    }
  });

  it("correctly handles HTML-like content in text", () => {
    const input =
      "This is <b>bold</b> and <i>italic</i> text <image>1042</image>";
    const result = parseMediaInjectionResponse(input, [42], []);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([
        {
          type: "text",
          textContent: "This is <b>bold</b> and <i>italic</i> text ",
        },
        { type: "image", numericId: 42 },
      ]);
    }
  });

  it("handles input with only media tags and no text", () => {
    const input = "<image>1042</image><video>2007</video>";
    const result = parseMediaInjectionResponse(input, [42], [7]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([
        { type: "image", numericId: 42 },
        { type: "video", numericId: 7 },
      ]);
    }
  });

  it("handles input with only text and no media tags", () => {
    const input = "This is just plain text with no media tags.";
    const result = parseMediaInjectionResponse(input, [], []);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([
        {
          type: "text",
          textContent: "This is just plain text with no media tags.",
        },
      ]);
    }
  });

  it("handles empty input", () => {
    const input = "";
    const result = parseMediaInjectionResponse(input, [], []);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });
});
