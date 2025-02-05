import { autorun, makeAutoObservable, runInAction } from "mobx";
import { type NotLoaded, Status, loading, notLoaded } from "~/common/status";
import { type DescendentStore } from "./descendentStore";

export class ThreadStore {
  private threadId: string | NotLoaded = notLoaded;

  constructor(private descendentStore: DescendentStore) {
    makeAutoObservable(this);
    autorun(() => {
      const threads = this.descendentStore.get("threads");
      if (threads instanceof Status) {
        return;
      }
      runInAction(() => {
        let thread = threads.find((t) => t.id === this.threadId);
        // we're good; a valid thread is selected
        if (thread) {
          return;
        }

        // try to grab the latest thread
        [thread] = threads.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
        if (thread) {
          this.threadId = thread.id;
          return;
        }

        // no thread is exists; create a new one
        // (this autorun logic will run again when the new thread is created)
        this.threadId = loading;
        void this.descendentStore.create("threads", {});
      });
    });
  }

  get thread() {
    if (this.threadId instanceof Status) {
      return this.threadId;
    }
    return this.descendentStore.getById("threads", this.threadId);
  }

  get messages() {
    const messages = this.descendentStore.get("messages");
    if (messages instanceof Status) {
      return messages;
    }
    return messages
      .filter((m) => m.threadId === this.threadId)
      .sort((m1, m2) => m1.createdAt.getTime() - m2.createdAt.getTime());
  }
}
