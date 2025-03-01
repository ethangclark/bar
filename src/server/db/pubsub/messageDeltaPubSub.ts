import { type MessageDelta } from "~/common/types";
import { PubSub } from "./pubsub";

export const messageDeltaPubSub = new PubSub<MessageDelta>("messageDelta");
