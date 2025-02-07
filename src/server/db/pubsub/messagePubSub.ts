import { Message } from "../schema";
import { PubSub } from "./pubsub";

export const messagePubSub = new PubSub<Message>("message");
