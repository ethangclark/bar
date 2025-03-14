import {
  createEmptyDescendents,
  createEmptyModifications,
  type Descendents,
  type Modifications,
} from "~/common/descendentUtils";
import { type MessageDelta } from "~/server/db/pubsub/messageDeltaPubSub";
import {
  type EvalKey,
  type Item,
  type Message,
  type Question,
} from "~/server/db/schema";
import {
  type DescendentServerInterface,
  DescendentStore,
} from "./descendentStore";

const defaultActivityId = "activityId";

async function getNewStore(
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
  const store = new DescendentStore(
    descendentServerInterface,
    {
      activityId: defaultActivityId,
    },
    { user: { id: "userId", name: null, email: null } },
    { hmrCount: 0 },
  );
  return { store, publishDescendents, publishMessageDelta };
}

describe(DescendentStore.name, () => {
  it("should delete descendents when the root descendent is deleted", async () => {
    // create a hierarchy of descendents
    const item: Item = {
      id: "itemId",
      activityId: defaultActivityId,
      orderFracIdx: "0",
    };
    const otherItem: Item = {
      id: "otherItemId",
      activityId: defaultActivityId,
      orderFracIdx: "1",
    };
    const question: Question = {
      id: "questionId",
      activityId: defaultActivityId,
      itemId: item.id,
      content: "questionContent",
    };
    const otherQuestion: Question = {
      id: "otherQuestionId",
      activityId: defaultActivityId,
      itemId: otherItem.id,
      content: "otherQuestionContent",
    };
    const evalKey: EvalKey = {
      id: "answerId",
      activityId: defaultActivityId,
      questionId: question.id,
      content: "answerContent",
    };
    const otherEvalKey: EvalKey = {
      id: "otherAnswerId",
      activityId: defaultActivityId,
      questionId: otherQuestion.id,
      content: "otherAnswerContent",
    };
    // an unrelated descendent
    const message: Message = {
      id: "messageId",
      content: "messageContent",
      createdAt: new Date(),
      activityId: defaultActivityId,
      userId: "userId",
      threadId: "threadId",
      senderRole: "user",
      doneGenerating: false,
    };
    // create the initial descendents
    const initialDescendents = {
      ...createEmptyDescendents(),
      items: [item, otherItem],
      questions: [question, otherQuestion],
      evalKeys: [evalKey, otherEvalKey],
      messages: [message],
    };
    const { store } = await getNewStore(
      () => initialDescendents,
      createEmptyModifications,
    );

    // ensure all descendents are loaded
    expect(store.get("items")).toEqual([item, otherItem]);
    expect(store.get("questions")).toEqual([question, otherQuestion]);
    expect(store.get("evalKeys")).toEqual([evalKey, otherEvalKey]);
    expect(store.get("messages")).toEqual([message]);

    // delete the item
    await store.delete("items", item.id);

    // ensure entire hierarchy is deleted
    expect(store.get("items")).toEqual([otherItem]);
    expect(store.get("questions")).toEqual([otherQuestion]);
    expect(store.get("evalKeys")).toEqual([otherEvalKey]);
    expect(store.get("messages")).toEqual([message]);
  });
});
