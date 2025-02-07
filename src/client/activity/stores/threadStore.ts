import { autorun, makeAutoObservable, runInAction } from "mobx";
import { type NotLoaded, Status, loading, notLoaded } from "~/common/status";
import { type DescendentStore } from "./descendentStore";

export class ThreadStore {
  public selectedThreadId: string | NotLoaded = notLoaded;

  constructor(private descendentStore: DescendentStore) {
    makeAutoObservable(this);
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
    return messages
      .filter((m) => m.threadId === this.selectedThreadId)
      .sort((m1, m2) => m1.createdAt.getTime() - m2.createdAt.getTime());
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

  selectThread(threadId: string) {
    this.selectedThreadId = threadId;
  }

  selectOrCreateThread() {
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
