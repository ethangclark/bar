import { type Descendents } from "~/server/descendents/descendentTypes";
import { PubSub } from "./pubsub";

export const descendentPubSub = new PubSub<Descendents>("descendents");
