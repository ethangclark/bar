import { identity } from "@trpc/server/unstable-core-do-not-import";
import { autorun, makeAutoObservable, reaction, runInAction } from "mobx";
import { trpc } from "~/trpc/proxy";
import { focusedEnrollmentStore } from "./focusedEnrollmentStore";
import { selectedTopicStore } from "./selectedTopicStore";
import { getMostRecentSession } from "../utils";
import { Status, notFound } from "~/common/utils/status";

class SelectedSessionStore {
  constructor() {
    makeAutoObservable(this);
    reaction(
      () => selectedTopicStore.topicTutoringSessions,
      (sessions) => {
        if (sessions instanceof Status || sessions.length === 0) {
          return;
        }
        const selectedId = this.sessionId;
        if (sessions.some((s) => s.id === selectedId)) {
          return;
        }
        const mostRecent = getMostRecentSession(sessions);
        if (mostRecent) {
          this.selectSession(mostRecent.id);
        }
      },
    );
    autorun(() => {
      const sessions = selectedTopicStore.topicTutoringSessions;
      if (!(sessions instanceof Status) && sessions.length === 0) {
        void selectedSessionStore.startNewSession({
          prevConclusion: null,
        });
      }
    });
  }
  sessionId = identity<string | null>(null);
  selectSession(sessionId: string) {
    this.sessionId = sessionId;
  }
  isCreatingSession = false;
  get selectedSession() {
    const sessions = selectedTopicStore.topicTutoringSessions;
    if (sessions instanceof Status) {
      return sessions;
    }
    return sessions.find((s) => s.id === this.sessionId) ?? notFound;
  }
  async startNewSession({ prevConclusion }: { prevConclusion: string | null }) {
    const { selectedTopicContext } = selectedTopicStore;
    const { enrollment } = focusedEnrollmentStore;
    if (!selectedTopicContext || enrollment instanceof Status) {
      return;
    }
    runInAction(() => {
      this.isCreatingSession = true;
      this.sessionId = null;
    });
    await trpc.tutoringSession.createTutoringSession.mutate({
      enrollmentId: enrollment.id,
      topicContext: selectedTopicContext,
      prevConclusion,
    });
    runInAction(() => {
      this.isCreatingSession = false;
    });
    await focusedEnrollmentStore.refetchEnrollment();
  }
}

export const selectedSessionStore = new SelectedSessionStore();
