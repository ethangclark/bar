import { messageDeltaPubSub } from "../db/pubsub/messageDeltaPubSub";
import { Message } from "../db/schema";

export async function streamResponse(toMessage: Message) {
  console.log("toMessage");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  messageDeltaPubSub.publish({
    activityId: toMessage.activityId,
    messageId: toMessage.id,
    contentDelta: "Hello, world!94333",
  });
}
