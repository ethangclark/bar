import {
  createEmptyDescendents,
  createEmptyModifications,
  type Descendents,
  type Modifications,
} from "~/common/descendentUtils";
import { type MessageDelta } from "~/common/types";
import { type Message } from "~/server/db/schema";
import {
  type DescendentServerInterface,
  DescendentStore,
} from "./descendentStore";
import { FocusedActivityStore } from "./focusedActivityStore";

function getNewStore(
  descendentLoader: () => Descendents,
  modificationResponder: () => Modifications,
) {
  let onDescendents: null | ((descendents: Descendents) => void) = null;
  const publishDescendents = (descendents: Descendents) => {
    onDescendents?.(descendents);
  };
  let onMessageDeltas: null | ((messageDelta: MessageDelta) => void) = null;
  const publishMessageDelta = (messageDelta: MessageDelta) => {
    onMessageDeltas?.(messageDelta);
  };
  const activityStore = new FocusedActivityStore({
    getActivity: async () => ({
      id: "activityId",
      type: "adHoc",
      title: "activityTitle",
      adHocActivity: {
        activityId: "activityId",
        title: "activityTitle",
        creatorId: "creatorId",
      },
      status: "published",
    }),
    updateActivityTitle: () => Promise.resolve(),
  });
  const descendentServerInterface: DescendentServerInterface = {
    readDescendents: () => Promise.resolve(descendentLoader()),
    subscribeToNewDescendents: (_, cb) => {
      onDescendents = cb;
      return {
        unsubscribe: () => {
          onDescendents = null;
        },
      };
    },
    subscribeToMessageDeltas: (_, cb) => {
      onMessageDeltas = cb;
      return {
        unsubscribe: () => {
          onMessageDeltas = null;
        },
      };
    },
    modifyDescendents: () => Promise.resolve(modificationResponder()),
  };
  const store = new DescendentStore(descendentServerInterface, activityStore);
  return { store, publishDescendents, publishMessageDelta };
}

describe(DescendentStore.name, () => {
  it("should load descendents", () => {
    const initialDescendents = createEmptyDescendents();
    const myMessage: Message = {
      id: "messageId",
      content: "messageContent",
      createdAt: new Date(),
      activityId: "activityId",
      userId: "userId",
      threadId: "threadId",
      senderRole: "user",
      completed: false,
    };
    initialDescendents.messages.push(myMessage);
    const store = getNewStore(
      () => initialDescendents,
      createEmptyModifications,
    );
  });
});
