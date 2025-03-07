import { PubSub } from "./pubsub";

export type ThreadWrapReason = "token-limit" | "activity-completed";
// not sure if we want these below
// | "activity-updates"
// | "app-updates";

export type ThreadWrap = {
  threadId: string;
  userId: string;
  activityId: string;
  reason: ThreadWrapReason;
};

export const threadWrapPubSub = new PubSub<ThreadWrap>("threadWrap");
