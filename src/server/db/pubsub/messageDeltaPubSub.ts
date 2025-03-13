import { z } from "zod";
import { messageSchema } from "../schema";
import { PubSub } from "./pubsub";

export const messageDeltaSchema = z.object({
  baseMessage: messageSchema,
  contentDelta: z.string(),
});
export type MessageDelta = z.infer<typeof messageDeltaSchema>;

export const messageDeltaPubSub = new PubSub<MessageDelta>("messageDelta");
