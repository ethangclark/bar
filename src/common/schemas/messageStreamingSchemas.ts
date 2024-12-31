import { z } from "zod";

export const MessageStreamItemSchema = z.union([
  z.object({
    done: z.literal(false),
    delta: z.string(),
  }),
  z.object({
    done: z.literal(true),
    conclusion: z.string().nullable(),
    masteryDemonstrated: z.boolean(),
  }),
]);
export type MessageStreamItem = z.infer<typeof MessageStreamItemSchema>;
