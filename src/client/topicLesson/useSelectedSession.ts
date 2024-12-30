import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { type TutoringSession, type TopicContext } from "~/server/db/schema";
import { getMostRecentSession } from "./utils";

interface UseSelectedSessionParams {
  enrollmentId: string;
  topicContext: TopicContext;
  topicTutoringSessions: TutoringSession[];
  refetchTutoringSessions: () => Promise<TutoringSession[]>;
}

export function useSelectedSession({
  enrollmentId,
  topicContext,
  topicTutoringSessions,
  refetchTutoringSessions,
}: UseSelectedSessionParams) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    () => getMostRecentSession(topicTutoringSessions)?.id ?? null,
  );

  useEffect(() => {
    if (
      selectedSessionId &&
      !topicTutoringSessions.some((s) => s.id === selectedSessionId)
    ) {
      setSelectedSessionId(null);
    }
  }, [selectedSessionId, topicTutoringSessions]);

  useEffect(() => {
    if (!selectedSessionId && topicTutoringSessions.length > 0) {
      setSelectedSessionId(
        getMostRecentSession(topicTutoringSessions)?.id ?? null,
      );
    }
  }, [selectedSessionId, topicTutoringSessions]);

  const { mutateAsync: createSession, isPending: isCreatingSession } =
    api.tutoringSession.createTutoringSession.useMutation();

  const startNewSession = useCallback(
    async (prevConclusion: string | null) => {
      setSelectedSessionId(null);
      await createSession({
        enrollmentId,
        topicContext,
        prevConclusion,
      });
      const newSessions = await refetchTutoringSessions();
      setSelectedSessionId(getMostRecentSession(newSessions)?.id ?? null);
    },
    [createSession, enrollmentId, refetchTutoringSessions, topicContext],
  );

  useEffect(() => {
    if (topicTutoringSessions.length === 0) {
      void startNewSession(null);
    }
  }, [startNewSession, topicTutoringSessions.length]);

  const selectedSession = useMemo(() => {
    return (
      topicTutoringSessions.find((s) => s.id === selectedSessionId) ?? null
    );
  }, [selectedSessionId, topicTutoringSessions]);

  return {
    isCreatingSession,
    selectedSession,
    setSelectedSessionId,
    startNewSession,
  };
}
