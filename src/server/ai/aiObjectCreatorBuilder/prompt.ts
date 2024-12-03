import { type BaseObject } from "~/common/utils/baseObject";
import { xmlTags } from "~/common/utils/constants";
import { type Item } from "./schemas";

const someQuestionsBlahBlahProvideMatchingAnswerPlz = `some questions wrapped in <${xmlTags.question}_n> XML tags, where n is a number. For each question, provide an answer wrapped in <${xmlTags.answer}_n> XML tags, where "n" matches the number of the question.`;

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

export function getPrompts<Base extends BaseObject>({
  introduction,
  items,
}: {
  introduction: string;
  items: Array<Item<Base>>;
}) {
  const systemPrompt = noScreenshotInstructions;
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
