import { identity } from "@trpc/server/unstable-core-do-not-import";
import { autorun, makeAutoObservable, runInAction } from "mobx";
import { useEffect } from "react";
import { trpc } from "~/trpc/proxy";
import { focusedEnrollmentStore } from "./focusedEnrollmentStore";
import { selectedTopicStore } from "./selectedTopicStore";
import { getMostRecentSession } from "../utils";

class SelectedSessionStore {
  constructor() {
    makeAutoObservable(this);
  }
  sessionId = identity<string | null>(null);
  isCreatingSession = false;
  get selectedSession() {
    return (
      selectedTopicStore.topicTutoringSessions.find(
        (s) => s.id === this.sessionId,
      ) ?? null
    );
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
  const topicSessions = selectedTopicStore.topicTutoringSessions;
  if (topicSessions.length === 0) {
    return;
  }
  const selectedId = selectedSessionStore.sessionId;
  if (topicSessions.some((s) => s.id === selectedId)) {
    return;
  }
  const mostRecent = getMostRecentSession(topicSessions);
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
    if (
      focusedEnrollmentStore.hasLoadedOnce &&
      !focusedEnrollmentStore.isLoading &&
      selectedTopicStore.topicTutoringSessions.length === 0
    ) {
      void selectedSessionStore.startNewSession({
        enrollmentId,
        prevConclusion: null,
      });
    }
  }, [enrollmentId]);
}
