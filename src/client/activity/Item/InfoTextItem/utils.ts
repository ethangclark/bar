import { assertTypesExhausted } from "~/common/assertions";

type TextSegment = { type: "text"; content: string };
type LaTeXSegment = { type: "latex"; content: string };
type ContentSegment = TextSegment | LaTeXSegment;

/**
 * Parses a string containing regular text and LaTeX tags
 * and returns an array of text and LaTeX segments.
 * @param input The input string to parse
 * @returns An array of content segments
 */
export function parseTextWithLatex(input: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  let currentIndex = 0;

  // Regular expression to find <latex> tags
  const latexRegex = /<latex>(.*?)<\/latex>/gs;
  let match: RegExpExecArray | null;

  // Check if the input starts with a <latex> tag
  const startsWithLatex = input.trimStart().startsWith("<latex>");
  if (startsWithLatex) {
    segments.push({ type: "text", content: "" });
  }

  while ((match = latexRegex.exec(input)) !== null) {
    const matchStartIndex = match.index;
    const matchEndIndex = latexRegex.lastIndex;

    // Add text before the LaTeX tag if there is any
    if (matchStartIndex > currentIndex) {
      const textContent = input.substring(currentIndex, matchStartIndex);
      segments.push({ type: "text", content: textContent });
    }

    // Add the LaTeX content (without the tags)
    const latexContent = match[1] ?? "";
    segments.push({ type: "latex", content: latexContent });

    // Update the current index
    currentIndex = matchEndIndex;
  }

  // Add any remaining text after the last LaTeX tag
  if (currentIndex < input.length) {
    const textContent = input.substring(currentIndex);
    segments.push({ type: "text", content: textContent });
  }

  // Check if the input ends with a </latex> tag
  const endsWithLatex = input.trimEnd().endsWith("</latex>");
  if (endsWithLatex) {
    segments.push({ type: "text", content: "" });
  }

  return segments.length === 0 ? [{ type: "text", content: input }] : segments;
}

export function joinSegments(segments: ContentSegment[]): string {
  return segments
    .map((s) => {
      switch (s.type) {
        case "text":
          return s.content;
        case "latex":
          return `<latex>${s.content}</latex>`;
        default:
          assertTypesExhausted(s);
      }
    })
    .join("");
}
