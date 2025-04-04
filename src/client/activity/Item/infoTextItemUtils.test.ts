import { describe, expect, it } from "vitest";
import { parseTextWithLatex } from "./infoTextItemUtils";

describe("parseTextWithLatex", () => {
  it("handles plain text without LaTeX", () => {
    const input = "This is just regular text.";
    const result = parseTextWithLatex(input);

    expect(result).toEqual([
      { type: "text", content: "This is just regular text." },
    ]);
  });

  it("handles text with a single LaTeX tag", () => {
    const input = "Here is a formula: <latex>E = mc^2</latex>";
    const result = parseTextWithLatex(input);

    expect(result).toEqual([
      { type: "text", content: "Here is a formula: " },
      { type: "latex", content: "E = mc^2" },
      { type: "text", content: "" },
    ]);
  });

  it("handles text with multiple LaTeX tags", () => {
    const input =
      "Formula 1: <latex>a^2 + b^2 = c^2</latex>. And formula 2: <latex>F = ma</latex>";
    const result = parseTextWithLatex(input);

    expect(result).toEqual([
      { type: "text", content: "Formula 1: " },
      { type: "latex", content: "a^2 + b^2 = c^2" },
      { type: "text", content: ". And formula 2: " },
      { type: "latex", content: "F = ma" },
      { type: "text", content: "" },
    ]);
  });

  it("handles text with LaTeX tags at the beginning and end", () => {
    const input =
      "<latex>\\sum_{i=1}^{n} i</latex> This is in the middle <latex>\\prod_{i=1}^{n} i</latex>";
    const result = parseTextWithLatex(input);

    expect(result).toEqual([
      { type: "text", content: "" },
      { type: "latex", content: "\\sum_{i=1}^{n} i" },
      { type: "text", content: " This is in the middle " },
      { type: "latex", content: "\\prod_{i=1}^{n} i" },
      { type: "text", content: "" },
    ]);
  });

  it("handles adjacent LaTeX tags", () => {
    const input = "Look: <latex>x</latex><latex>y</latex> interesting!";
    const result = parseTextWithLatex(input);

    expect(result).toEqual([
      { type: "text", content: "Look: " },
      { type: "latex", content: "x" },
      { type: "latex", content: "y" },
      { type: "text", content: " interesting!" },
    ]);
  });

  it("handles empty LaTeX tags", () => {
    const input = "Before <latex></latex> After";
    const result = parseTextWithLatex(input);

    expect(result).toEqual([
      { type: "text", content: "Before " },
      { type: "latex", content: "" },
      { type: "text", content: " After" },
    ]);
  });

  it("handles an empty string", () => {
    const input = "";
    const result = parseTextWithLatex(input);

    expect(result).toEqual([{ type: "text", content: "" }]);
  });
});
