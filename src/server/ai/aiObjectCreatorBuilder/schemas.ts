import { type BaseObject } from "~/common/utils/baseObject";
import { type Result } from "~/common/utils/result";
import { type Prompts } from "../llm/schemas";

export type PromptFieldArg<Base extends BaseObject, Slug extends string, U> = {
  slug: Slug;
  prompt: string;
  ingestResponse?: (params: {
    response: string;
    prev: Base;
    slug: Slug;
  }) => Result<Base & { [key in Slug]: string } & U>;
};
type PromptField<
  Base extends BaseObject,
  Slug extends string,
  U,
> = PromptFieldArg<Base, Slug, U> & {
  type: "promptField";
};

type TransformArg<Base extends BaseObject> = {
  slug: string;
  condition: boolean;
  prompt: string;
  transform: (response: string, base: Base) => Result<Base>;
};

type Transform<Base extends BaseObject> = TransformArg<Base> & {
  type: "transform";
};

export type Builder<Base extends BaseObject> = {
  add<Slug extends string, U>(
    promptField: PromptFieldArg<Base, Slug, U>,
  ): Builder<
    Base & {
      [key in Slug]: string;
    } & U
  >;
  conditionalTransform(params: TransformArg<Base>): Builder<Base>;
  build(): (params: {
    userId: string;
  }) => Promise<Result<{ data: Base; prompts: Prompts }>>;
};

export type Item<Base extends BaseObject> =
  | PromptField<Base, string, unknown>
  | Transform<Base>;
