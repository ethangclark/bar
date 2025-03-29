import {
  type Descendents,
  type Modifications,
  createEmptyDescendents,
  createEmptyModifications,
} from "~/common/descendentUtils";
import { PubSub } from "./pubsub";

export const descendentPubSub = new PubSub<Modifications>("descendents");

// this assumes subscribers can handle updates as upserts
export async function publishDescendentUpserts(
  descendents: Partial<Descendents>,
) {
  await descendentPubSub.publish({
    ...createEmptyModifications(),
    toUpdate: {
      ...createEmptyDescendents(),
      ...descendents,
    },
  });
}

export async function publishDescendentDeletions(
  descendents: Partial<Descendents>,
) {
  await descendentPubSub.publish({
    ...createEmptyModifications(),
    toDelete: {
      ...createEmptyDescendents(),
      ...descendents,
    },
  });
}
