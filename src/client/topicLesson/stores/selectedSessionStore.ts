import { identity } from "@trpc/server/unstable-core-do-not-import";
import { autorun, makeAutoObservable, runInAction } from "mobx";
import { useEffect } from "react";
import { trpc } from "~/trpc/proxy";
import { focusedEnrollmentStore } from "./focusedEnrollmentStore";
import { selectedTopicStore } from "./selectedTopicStore";
import { getMostRecentSession } from "../utils";
import { Status, notFound } from "~/common/utils/status";

class SelectedSessionStore {
  constructor() {
    makeAutoObservable(this);
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
  async startNewSession({
    enrollmentId,
    prevConclusion,
  }: {
    enrollmentId: string;
    prevConclusion: string | null;
  }) {
    if (!selectedTopicStore.selectedTopicContext) {
      return;
    }
    runInAction(() => {
      this.isCreatingSession = true;
      this.sessionId = null;
    });
    await trpc.tutoringSession.createTutoringSession.mutate({
      enrollmentId,
      topicContext: selectedTopicStore.selectedTopicContext,
      prevConclusion,
    });
    runInAction(() => {
      this.isCreatingSession = false;
    });
    await focusedEnrollmentStore.refetchEnrollment();
  }
}

export const selectedSessionStore = new SelectedSessionStore();

autorun(() => {
  const sessions = selectedTopicStore.topicTutoringSessions;
  if (sessions instanceof Status || sessions.length === 0) {
    return;
  }
  const selectedId = selectedSessionStore.sessionId;
  if (sessions.some((s) => s.id === selectedId)) {
    return;
  }
  const mostRecent = getMostRecentSession(sessions);
  if (mostRecent) {
    selectedSessionStore.sessionId = mostRecent.id;
  }
});

export function useAutoStartSession({
  enrollmentId,
}: {
  enrollmentId: string;
}) {
  useEffect(() => {
    const sessions = selectedTopicStore.topicTutoringSessions;
    if (!(sessions instanceof Status) && sessions.length === 0) {
      void selectedSessionStore.startNewSession({
        enrollmentId,
        prevConclusion: null,
      });
    }
  }, [enrollmentId]);
}
