import { MessageDeltaItem } from "~/common/types";
import { PubSub } from "./pubsub";

export const messageDeltaPubSub = new PubSub<MessageDeltaItem>("messageDelta");
