import { z } from "zod";

// see https://openrouter.ai/docs/requests for other addable fields

// see https://openrouter.ai/models
const modelSchema = z.enum([
  "anthropic/claude-3.5-sonnet:beta",
  "google/gemini-flash-1.5",
  "google/gemini-flash-1.5-8b",
  "openai/o1-preview-2024-09-12",
]);
export type Model = z.infer<typeof modelSchema>;

const textContentSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});
export type TextContent = z.infer<typeof textContentSchema>;

const imageContentSchema = z.object({
  type: z.literal("image_url"),
  image_url: z.object({
    url: z.string(),
  }),
});
export type ImageContentPart = z.infer<typeof imageContentSchema>;

const contentPartSchema = z.union([textContentSchema, imageContentSchema]);
export type ContentPart = z.infer<typeof contentPartSchema>;

export const roleSchema = z.enum(["user", "assistant", "system"]);
export type Role = z.infer<typeof roleSchema>;

const message = z.object({
  role: roleSchema,
  content: z.union([z.string(), z.array(contentPartSchema)]),
  name: z.string().optional(),
});
export type Message = z.infer<typeof message>;

const openRouterRequest = z.object({
  model: modelSchema,
  messages: z.array(message),
});
export type OpenRouterRequest = z.infer<typeof openRouterRequest>;

const nonStreamingChoiceSchema = z.object({
  finish_reason: z.string().optional(),
  message: message,
  error: z
    .object({
      code: z.number(),
      message: z.string(),
    })
    .optional(),
});
export type NonStreamingChoice = z.infer<typeof nonStreamingChoiceSchema>;

const responseUsageSchema = z.object({
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),
});
export type ResponseUsage = z.infer<typeof responseUsageSchema>;

export const openRouterResponseSchema = z.object({
  id: z.string(),
  choices: z.array(nonStreamingChoiceSchema), // IF CHANGING: make usage optional
  usage: responseUsageSchema,
});
export type OpenRouterResponse = z.infer<typeof openRouterResponseSchema>;
