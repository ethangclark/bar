import {
  type Result,
  failure,
  isFailure,
  failureType,
} from "~/common/utils/result";
import { xmlTags } from "~/common/utils/constants";
import { oneTagContent } from "~/common/utils/xmlUtils";
import { type BaseObject, baseObject } from "~/common/utils/baseObject";
import {
  type Builder,
  type ImageOptions,
  type Item,
  type PromptFieldArg,
} from "./schemas";
import { getPrompts } from "./prompt";
import { getResponseFromLlm } from "../llm";

export function _parseItemResponseInner<Base extends BaseObject>({
  itemIdx,
  response,
  item,
  isLastItem,
  tagToTry,
}: {
  itemIdx: number;
  response: string;
  item: Item<Base>;
  isLastItem: boolean;
  tagToTry: string;
}) {
  const tag = `${tagToTry}_${itemIdx + 1}`;
  let xml = response;
  if (isLastItem && xml.includes(`<${tag}>`) && !xml.includes(`</${tag}>`)) {
    xml = xml + `</${tag}>`; // GPT-4o sometimes cuts off the closing tag
  }
  const result = oneTagContent({ tag, xml });
  if (isFailure(result)) {
    return failure(
      `Response received from AI did not contain response for field "${item.slug}" (${tag}) in aiObjectCreator. Reason: "${result.problem}".`,
      failureType.badAiResponse,
      { response, xmlParseResult: result },
    );
  }
  return result;
}

export function _parseItemResponse<Base extends BaseObject>(params: {
  itemIdx: number;
  response: string;
  item: Item<Base>;
  isLastItem: boolean;
}) {
  const responseTagResult = _parseItemResponseInner({
    ...params,
    tagToTry: xmlTags.answer,
  });
  if (!isFailure(responseTagResult)) {
    return responseTagResult;
  }
  const promptTagResult = _parseItemResponseInner({
    ...params,
    tagToTry: xmlTags.question,
  });
  if (!isFailure(promptTagResult)) {
    return promptTagResult;
  }
  return responseTagResult;
}

export function _ingestItemResponse<Base extends BaseObject>({
  item,
  itemResponse,
  inProgress,
  response,
}: {
  item: Item<Base>;
  itemResponse: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inProgress: Record<string, any>;
  response: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): Result<Record<string, any>> {
  switch (item.type) {
    case "promptField":
      const ingestionResult = item.ingestResponse
        ? item.ingestResponse({
            response: itemResponse,
            prev: inProgress as Base,
            slug: item.slug,
          })
        : { ...inProgress, [item.slug]: itemResponse };
      if (isFailure(ingestionResult)) {
        return failure(
          `Error ingesting response for field "${item.slug}" in aiObjectCreator. Reason: "${ingestionResult.problem}".`,
          ingestionResult.type ?? failureType.badAiResponse,
          { response, itemResponse, ingestionResult },
        );
      }
      return ingestionResult;
    case "transform":
      const transformResult = item.transform(itemResponse, inProgress as Base);
      if (isFailure(transformResult)) {
        return failure(
          `Error transforming response for field "${item.slug}" in aiObjectCreator. Reason: "${transformResult.problem}".`,
          transformResult.type ?? failureType.badAiResponse,
          { response, itemResponse, transformResult },
        );
      }
      return transformResult;
  }
}

export function _buildResult<Base extends BaseObject>({
  items,
  response,
}: {
  items: Array<Item<Base>>;
  response: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let inProgress: Record<string, any> = { ...baseObject };
  // must be in serial because ingestResponse accepts a `prev` argument
  for (const [idx, item] of items.entries()) {
    const itemResponse = _parseItemResponse({
      itemIdx: idx,
      response,
      item,
      isLastItem: idx === items.length - 1,
    });
    if (isFailure(itemResponse)) {
      return itemResponse;
    }

    const result = _ingestItemResponse({
      item,
      itemResponse,
      inProgress,
      response,
    });
    if (isFailure(result)) {
      return result;
    }
    inProgress = result;
  }
  return { data: inProgress as Base };
}

export function _getExec<Base extends BaseObject>({
  introduction,
  imageOptions,
  items,
  pngBuffers = [],
  userId,
}: {
  introduction: string;
  imageOptions: ImageOptions;
  items: Array<Item<Base>>;
  pngBuffers?: Buffer[];
  userId: string;
}) {
  return async () => {
    const prompts = getPrompts({
      introduction,
      imageOptions,
      items,
    });
    const { systemPrompt, prompt } = prompts;
    const llmResult = await getResponseFromLlm({
      systemPrompt,
      messages: [
        { type: "text" as const, content: prompt },
        ...pngBuffers.map((buffer) => ({
          type: "png" as const,
          content: buffer,
        })),
      ],
      userId,
    });
    if (isFailure(llmResult)) {
      return llmResult;
    }
    const { response } = llmResult;
    const result = _buildResult({ items, response });
    return {
      ...result,
      prompts,
    };
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function builderCore<Base extends BaseObject, Images extends ImageOptions>(
  imageOptions: Images,
  introduction: string,
  items: Array<Item<Base>>,
): Builder<Base, Images> {
  return {
    add<Slug extends string, U>(promptField: PromptFieldArg<Base, Slug, U>) {
      const nextItems = [
        ...items,
        { ...promptField, type: "promptField" } as Item<Base>,
      ];
      const newBase: Builder<Base, Images> = builderCore(
        imageOptions,
        introduction,
        nextItems,
      );
      return newBase as unknown as Builder<
        Base & { [key in Slug]: string } & U,
        Images
      >;
    },
    conditionalTransform({ condition, slug, prompt, transform }) {
      if (!condition) {
        return builderCore(imageOptions, introduction, items);
      }
      const nextItems = [
        ...items,
        { type: "transform" as const, slug, condition, prompt, transform },
      ];
      return builderCore(imageOptions, introduction, nextItems);
    },
    build() {
      return async ({ userId, pngBuffers = [] }) => {
        const exec = _getExec({
          introduction,
          imageOptions,
          items,
          pngBuffers,
          userId,
        });
        const maxAttempts = 3;
        // try n - 1 times to get a good response with retries
        for (let attempt = 1; attempt < maxAttempts; attempt++) {
          const result = await exec();
          if (isFailure(result)) {
            if (result.type === failureType.badAiResponse) {
              continue;
            }
          }
          return result;
        }
        // return the last attempt
        return exec();
      };
    },
  };
}

export function aiObjectCreatorBuilder<Images extends ImageOptions>(
  // difficulty: "normal" | "hard", // TDOO: use kahuna for hard ones?
  imageOptions: Images,
  introduction: string,
) {
  return builderCore(imageOptions, introduction, []);
}
