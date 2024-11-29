import { type BaseObject } from "~/common/utils/baseObject";
import { xmlTags } from "~/common/utils/constants";
import { type ImageOptions, type Item } from "./schemas";

const someQuestionsBlahBlahProvideMatchingAnswerPlz = `some questions wrapped in <${xmlTags.question}_n> XML tags, where n is a number. For each question, provide an answer wrapped in <${xmlTags.answer}_n> XML tags, where "n" matches the number of the question.`;

const someQuestionsBlahBlahProvideMatchingAnswerPlzWithExamples = `${someQuestionsBlahBlahProvideMatchingAnswerPlz}

Example questions / answer:

<${xmlTags.question}_1>What is the title of the page?</${xmlTags.question}_1>
<${xmlTags.question}_2>List three buttons on the page. Wrap each answer in a <button> tag.</${xmlTags.question}_2>

<!-- your answer -->
<${xmlTags.answer}_1>User dashboard</${xmlTags.answer}_1>
<${xmlTags.answer}_2>
  <button>Create new user</button>
  <button>Search</button>
  <button>Export to CSV</button>
</${xmlTags.answer}_2>`;

const basicScreenshotInstructions = `You will receive a screenshot from a Playwright browser automation test, and ${someQuestionsBlahBlahProvideMatchingAnswerPlzWithExamples}`;

const beforAndAfterScreenshotInstructions = `You will receive a "before" and an "after" screenshot from a Playwright browser automation test, and ${someQuestionsBlahBlahProvideMatchingAnswerPlzWithExamples}`;

const baseAndAnnotatedInstructions = `You will receive a screenshot from a Playwright browser automation test, an annotated version of that screenshot. The annotated version of the screenshot is the same screenshot as the original, only parts of it have been divided up into rows and columns, like an excel sheet, with row numbers on the left and column letters at the top. You will allso receive ${someQuestionsBlahBlahProvideMatchingAnswerPlzWithExamples}`;

const noScreenshotInstructions = `You receive ${someQuestionsBlahBlahProvideMatchingAnswerPlz}

Example questions / answer:

<${xmlTags.question}_1>What is 2+2?</${xmlTags.question}_1>
<${xmlTags.question}_2>List three colors. Wrap each color in a <color> tag.</${xmlTags.question}_2>

<!-- your answer -->
<${xmlTags.answer}_1>4</${xmlTags.answer}_1>
<${xmlTags.answer}_2>
  <color>red</color>
  <color>yellow</color>
  <color>blue</color>
</${xmlTags.answer}_2>`;

const instructions: Record<ImageOptions, string> = {
  basicScreenshot: basicScreenshotInstructions,
  beforeAndAfter: beforAndAfterScreenshotInstructions,
  baseAndAnnotated: baseAndAnnotatedInstructions,
  noImg: noScreenshotInstructions,
};

export function getPrompts<Base extends BaseObject>({
  introduction,
  imageOptions,
  items,
}: {
  introduction: string;
  imageOptions: ImageOptions;
  items: Array<Item<Base>>;
}) {
  const systemPrompt = instructions[imageOptions];
  const prompt =
    introduction +
    "\n\n" +
    items
      .map((item, idx) => {
        return `<${xmlTags.question}_${idx + 1}>\n${item.prompt}\n</${xmlTags.question}_${idx + 1}>`;
      })
      .join("\n\n");
  return { systemPrompt, prompt };
}
