import { autorun, makeAutoObservable, runInAction } from "mobx";
import { Status, loading, notLoaded } from "~/common/status";
import { type Thread } from "~/server/db/schema";
import { type ActivityStore } from "./activityStore";

export class ThreadStore {
  private thread: Thread | Status = notLoaded;

  constructor(private activityStore: ActivityStore) {
    makeAutoObservable(this);
    autorun(() => {
      const threads = this.activityStore.getDrafts("threads");
      runInAction(() => {
        if (threads instanceof Status) {
          this.thread = threads;
          return;
        }
        // grab latest thread
        const [thread] = threads.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
        if (thread === undefined) {
          this.thread = loading;
          setTimeout(() => {
            this.activityStore.create("threads", {});
          });
        } else {
          this.thread = thread;
        }
      });
    });
  }

  get messages() {
    const { thread } = this;
    if (thread instanceof Status) {
      return [];
    }
    const messages = this.activityStore.getDrafts("messages");
    if (messages instanceof Status) {
      return [];
    }
    return messages
      .filter((m) => m.threadId === thread.id)
      .sort((m1, m2) => m1.createdAt.getTime() - m2.createdAt.getTime());
  }
}
