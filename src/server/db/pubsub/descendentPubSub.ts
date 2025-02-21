import { type Descendents } from "~/common/descendentUtils";
import { PubSub } from "./pubsub";

export const descendentPubSub = new PubSub<Descendents>("descendents");
