export const colors = {
  themeColorHex: "#299d8f",
};

export const xmlTags = {
  answer: "answer",
  implementationIdea: "implementationIdea",
  question: "question",
} as const;

// BEGIN BROWSER SIZING LOGIC

const maxAnthropicWidth = 1268; // https://docs.anthropic.com/en/docs/build-with-claude/vision
const maxAnthropicHeight = 951; // https://docs.anthropic.com/en/docs/build-with-claude/vision

const maxOpenAIWidth = 1280; // https://openai.com/api/pricing/
const maxOpenAIHeight = 960; // https://openai.com/api/pricing/

export const minRelevantApiWidth = Math.min(maxAnthropicWidth, maxOpenAIWidth);
export const minRelevantApiHeight = Math.min(
  maxAnthropicHeight,
  maxOpenAIHeight,
);

export const annotationRows = 25; // <= alphabet.length;
export const annotationCols = 32; // <= alphabet.length;

export const browsyBrowserWidth =
  Math.floor(minRelevantApiWidth / annotationCols) * annotationCols;
export const browsyBrowserHeight =
  Math.floor(minRelevantApiHeight / annotationRows) * annotationRows;

export const rowHeight = browsyBrowserHeight / annotationRows;
export const columnWidth = browsyBrowserWidth / annotationCols;

// END BROWSER SIZING LOGIC

export const pageLoadedClassname = "weareloadeddogg";

export const cursorColors = [
  "red",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  // "orange",
  // "brown",
];
