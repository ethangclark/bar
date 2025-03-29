import { Modal } from "antd";
import { autorun, makeAutoObservable, reaction } from "mobx";
import { Status, isStatus, notLoaded } from "~/client/utils/status";
import { assertTypesExhausted } from "~/common/assertions";
import { indexById } from "~/common/indexUtils";
import {
  type ThreadWrap,
  type ThreadWrapReason,
} from "~/server/db/pubsub/threadWrapPubSub";
import { type Thread } from "~/server/db/schema";
import { trpc } from "~/trpc/proxy";
import { type DescendentStore } from "./descendentStore";
import { type FocusedActivityStore } from "./focusedActivityStore";
import { type LocationStore } from "./locationStore";
import { type UserStore } from "./userStore";

function threadWrapReasonToTitle(reason: ThreadWrapReason) {
  switch (reason) {
    case "token-limit":
      return "Switching to a new conversation";
    case "activity-completed":
      return "Activity complete!";
    default:
      assertTypesExhausted(reason);
  }
}

function threadWrapReasonToMessage(reason: ThreadWrapReason) {
  switch (reason) {
    case "token-limit":
      return "This conversation has gotten too long for me to keep track of. I'm going to start a new one and we can pick up where we left off.";
    case "activity-completed":
      return "You've completed this activity. This conversation will be saved for your reference. A new conversation will be created in case you want to keep discussing the material.";
    default:
      assertTypesExhausted(reason);
  }
}

function threadsNewToOld(threads: Thread[]) {
  return threads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export class ThreadStore {
  constructor(
    private descendentStore: DescendentStore,
    private focusedActivityStore: FocusedActivityStore,
    private userStore: UserStore,
    private locationStore: LocationStore,
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

  private subscribeToThreadWraps(activityId: string) {
    const subscription = trpc.threadWrap.threadWraps.subscribe(
      { activityId },
      {
        onData: (threadWrap: ThreadWrap) => {
          const userId = isStatus(this.userStore.user)
            ? null
            : this.userStore.user.id;
          if (threadWrap.userId !== userId) {
            return;
          }
          Modal.info({
            title: threadWrapReasonToTitle(threadWrap.reason),
            content: threadWrapReasonToMessage(threadWrap.reason),
            onOk: () => {
              this.selectThread(threadWrap.threadId);
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

  public selectThread(threadId: string) {
    this.locationStore.setSearchParam("threadId", threadId);
  }

  private get threads() {
    const { user } = this.userStore;
    if (user instanceof Status) {
      return user;
    }
    const threads = this.descendentStore.get("threads");
    if (threads instanceof Status) {
      return threads;
    }
    return threads.filter((t) => t.userId === user.id);
  }

  private get defaultThread() {
    const { threads } = this;
    if (threads instanceof Status) {
      return threads;
    }
    return threadsNewToOld(threads)[0] ?? notLoaded;
  }

  private get threadSet() {
    const { threads } = this;
    if (threads instanceof Status) {
      return threads;
    }
    return indexById(threads);
  }

  get thread() {
    const threadId = this.locationStore.searchParam("threadId");
    if (threadId === undefined) {
      return this.defaultThread;
    }
    const { threadSet } = this;
    if (threadSet instanceof Status) {
      return threadSet;
    }
    const thread = threadSet[threadId];
    if (thread) {
      return thread;
    }
    return this.defaultThread;
  }

  get timeOrderedThreads() {
    const { threads } = this;
    if (threads instanceof Status) {
      return threads;
    }
    return threadsNewToOld(threads);
  }

  get latestThread() {
    const { timeOrderedThreads } = this;
    if (timeOrderedThreads instanceof Status) {
      return timeOrderedThreads;
    }
    return timeOrderedThreads[0] ?? notLoaded;
  }

  get organizedThreads() {
    const { timeOrderedThreads, thread } = this;
    if (timeOrderedThreads instanceof Status || thread instanceof Status) {
      return timeOrderedThreads;
    }
    // put selected thread first
    return [thread, ...timeOrderedThreads.filter((t) => t.id !== thread.id)];
  }

  get isOldThread() {
    const { thread, latestThread } = this;
    if (thread instanceof Status || latestThread instanceof Status) {
      return false;
    }
    return thread.id !== latestThread.id;
  }

  get messages() {
    const { thread } = this;
    if (thread instanceof Status) {
      return thread;
    }
    const messages = this.descendentStore.get("messages");
    if (messages instanceof Status) {
      return messages;
    }
    const v = messages
      .filter((m) => m.threadId === thread.id)
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
    switch (lastMessage.status) {
      case "completeWithViewPieces":
      case "completeWithoutViewPieces":
        return true;
      case "incomplete":
        return false;
      default:
        assertTypesExhausted(lastMessage.status);
    }
  }

  async createThread() {
    const newThread = await this.descendentStore.create("threads", {});
    this.selectThread(newThread.id);
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

  selectLatestThread() {
    const { latestThread } = this;
    if (latestThread instanceof Status) {
      throw new Error("Threads not loaded");
    }
    this.selectThread(latestThread.id);
  }
}
