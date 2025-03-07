import { Modal } from "antd";
import { autorun, makeAutoObservable, reaction, runInAction } from "mobx";
import {
  type NotLoaded,
  Status,
  loading,
  notLoaded,
} from "~/client/utils/status";
import { assertTypesExhausted } from "~/common/assertions";
import { ThreadWrapReason } from "~/server/db/pubsub/threadWrapPubSub";
import { trpc } from "~/trpc/proxy";
import { type DescendentStore } from "./descendentStore";
import { FocusedActivityStore } from "./focusedActivityStore";

function threadWrapReasonToMessage(reason: ThreadWrapReason) {
  switch (reason) {
    case "token-limit":
      return "This conversation has gotten a bit long for me to keep track of. I'm going to start a new one and we can pick up where we left off.";
    case "activity-completed":
      return "This activity is complete! I'm going to start a new conversation in case you want to keep discussing the material.";
    default:
      assertTypesExhausted(reason);
  }
}

export class ThreadStore {
  public selectedThreadId: string | NotLoaded = notLoaded;

  constructor(
    private descendentStore: DescendentStore,
    private focusedActivityStore: FocusedActivityStore,
  ) {
    makeAutoObservable(this);
    autorun(() => {
      const { activityId } = this.focusedActivityStore;
      if (!activityId) {
        return;
      }
      this.subscribeToThreadWraps(activityId);
    });
  }

  private setSelectedThreadId(threadId: string) {
    this.selectedThreadId = threadId;
  }

  private subscribeToThreadWraps(activityId: string) {
    const subscription = trpc.threadWrap.threadWraps.subscribe(
      { activityId },
      {
        onData: (threadWrap) => {
          Modal.info({
            title: "Starting a new thread",
            content: threadWrapReasonToMessage(threadWrap.reason),
            onOk: () => {
              this.setSelectedThreadId(threadWrap.threadId);
            },
          });
        },
      },
    );
    reaction(
      () => this.focusedActivityStore.activityId,
      () => {
        subscription.unsubscribe();
      },
      {
        fireImmediately: false,
      },
    );
  }

  get thread() {
    if (this.selectedThreadId instanceof Status) {
      return this.selectedThreadId;
    }
    return this.descendentStore.getById("threads", this.selectedThreadId);
  }

  get sortedThreads() {
    const threads = this.descendentStore.get("threads");
    if (threads instanceof Status) {
      return threads;
    }
    const sorted = threads.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    // put selected thread first
    const selectedThread = sorted.find((t) => t.id === this.selectedThreadId);
    if (selectedThread) {
      return [
        selectedThread,
        ...sorted.filter((t) => t.id !== this.selectedThreadId),
      ];
    }
    return sorted;
  }

  get messages() {
    const messages = this.descendentStore.get("messages");
    if (messages instanceof Status) {
      return messages;
    }
    const v = messages
      .filter((m) => m.threadId === this.selectedThreadId)
      .sort((m1, m2) => m1.createdAt.getTime() - m2.createdAt.getTime());
    return v;
  }

  get lastMessageComplete() {
    const messages = this.messages;
    if (messages instanceof Status) {
      return messages;
    }
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      return true;
    }
    return lastMessage.doneGenerating;
  }

  async createThread() {
    runInAction(() => {
      this.selectedThreadId = loading;
    });
    const newThread = await this.descendentStore.create("threads", {});
    runInAction(() => {
      this.selectedThreadId = newThread.id;
    });
  }

  async removeCompletions() {
    const completions = this.descendentStore.get("completions");
    if (completions instanceof Status) {
      throw new Error(
        "Completions not loaded -- cannot reset activity progress.",
      );
    }
    await this.descendentStore.deleteByIds(
      "completions",
      completions.map((c) => c.id),
    );
  }

  selectThread(threadId: string) {
    this.selectedThreadId = threadId;
  }

  ensureThreadSelection() {
    const stop = autorun(() => {
      const threads = this.descendentStore.get("threads");
      if (threads instanceof Status) {
        return;
      }
      runInAction(() => {
        let thread = threads.find((t) => t.id === this.selectedThreadId);
        // we're good; a valid thread is selected
        if (thread) {
          this.selectedThreadId = thread.id;
          stop();
          return;
        }

        // try to grab the latest thread
        [thread] = threads.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
        if (thread) {
          this.selectedThreadId = thread.id;
          stop();
          return;
        }

        // no thread is exists; create a new one
        // (this autorun logic will run again when the new thread is created)
        void this.createThread();
      });
    });
  }
}
