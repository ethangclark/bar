import { z } from "zod";
import { type SenderRole, senderRoleSchema } from "~/server/db/schema";

// see https://openrouter.ai/docs/requests for other addable fields

// see https://openrouter.ai/models
const modelSchema = z.enum([
  // "anthropic/claude-3.5-sonnet:beta",
  // "google/gemini-2.0-flash-thinking-exp:free", // rate limits are bad
  "google/gemini-2.0-flash-001",
  // "google/gemini-2.0-pro-exp-02-05:free", // rate limits are bad
  // "deepseek/deepseek-chat",
  "deepseek/deepseek-chat-v3-0324",
]);
export type Model = z.infer<typeof modelSchema>;

export const defaultModel: Model = "google/gemini-2.0-flash-001";
// export const defaultModel: Model = "deepseek/deepseek-chat-v3-0324";

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

export const roleSchema = senderRoleSchema;
export type Role = SenderRole;

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

const errorResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
});

const nonStreamingChoiceSchema = z.object({
  finish_reason: z.string().nullable().optional(),
  message: message,
  error: errorResponseSchema.optional(),
});
export type NonStreamingChoice = z.infer<typeof nonStreamingChoiceSchema>;

const streamingChoiceSchema = z.object({
  finish_reason: z.string().nullable().optional(),
  delta: z.object({
    role: roleSchema,
    content: z.string().nullable(),
  }),
  error: errorResponseSchema.optional(),
});

const responseUsageSchema = z.object({
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),
});
export type ResponseUsage = z.infer<typeof responseUsageSchema>;

export const openRouterResponseSchema = z.object({
  choices: z.array(nonStreamingChoiceSchema).optional(),
  usage: responseUsageSchema,
});
export type OpenRouterResponse = z.infer<typeof openRouterResponseSchema>;

export const streamingOpenRouterResponseSchema = z.object({
  choices: z.array(streamingChoiceSchema).optional(),
  // Usage data is always returned for non-streaming.
  // When streaming, you will get one usage object at
  // the end accompanied by an empty choices array.
  usage: responseUsageSchema.optional(),
});
export type StreamingOpenRouterResponse = z.infer<
  typeof streamingOpenRouterResponseSchema
>;
