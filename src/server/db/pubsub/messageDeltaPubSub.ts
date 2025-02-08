import { type MessageDeltaSchema } from "~/common/types";
import { PubSub } from "./pubsub";

export const messageDeltaPubSub = new PubSub<MessageDeltaSchema>(
  "messageDelta",
);
