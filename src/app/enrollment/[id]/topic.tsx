import { Spin } from "antd";
import { useEffect, useState } from "react";
import { type TutoringSession, type TopicContext } from "~/server/db/schema";
import { api } from "~/trpc/react";

function getMostRecentSession(sessions: TutoringSession[]) {
  const mostRecentFirst = sessions.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  return mostRecentFirst[0] ?? null;
}

function useSelectedSession({
  enrollmentId,
  topicContext,
  topicTutoringSessions,
  refetchTutoringSessions,
}: {
  enrollmentId: string;
  topicContext: TopicContext;
  topicTutoringSessions: TutoringSession[];
  refetchTutoringSessions: () => Promise<void>;
}) {
  const [selectedSession, setSelectedSession] =
    useState<TutoringSession | null>(() =>
      getMostRecentSession(topicTutoringSessions),
    );
  const { mutateAsync } =
    api.tutoringSession.createTutoringSession.useMutation();
  useEffect(() => {
    if (selectedSession) {
      return;
    }
    async function effect() {
      const session = await mutateAsync({
        enrollmentId,
        topicContext,
      });
      await refetchTutoringSessions();
      setSelectedSession(session);
    }
    void effect();
  }, [
    mutateAsync,
    enrollmentId,
    refetchTutoringSessions,
    selectedSession,
    topicContext,
  ]);
  return { selectedSession, setSelectedSession };
}

export function Topic({
  enrollmentId,
  topicContext,
  topicTutoringSessions,
  refetchTutoringSessions,
}: {
  enrollmentId: string;
  topicContext: TopicContext;
  topicTutoringSessions: TutoringSession[];
  refetchTutoringSessions: () => Promise<void>;
}) {
  const { course, courseType, unit, module, topic } = topicContext;

  const { selectedSession, setSelectedSession } = useSelectedSession({
    enrollmentId,
    topicContext,
    topicTutoringSessions,
    refetchTutoringSessions,
  });

  const { isLoading: areMessagesLoading, data: messages } =
    api.tutoringSession.chatMessages.useQuery({
      tutoringSessionId: selectedSession?.id ?? null,
    });

  if (areMessagesLoading || !messages?.length) {
    return <Spin />;
  }

  return (
    <div
      className="mb-2 flex h-full w-full flex-col px-8"
      style={{ width: 672 }}
    >
      <div>
        {courseType.name} &gt; {unit.name} &gt; {module.name}
      </div>
      <div className="mb-4 text-2xl">{topic.name}</div>
      <div className="outline-3 h-full w-full rounded-3xl p-8 outline outline-gray-200">
        <h1>{courseType.name}</h1>
        <h2>{course.id}</h2>
        <h3>{unit.name}</h3>
        <h4>{module.name}</h4>
        <h5>{topic.name}</h5>
        <h6>Messages:</h6>
        {messages.map((m) => (
          <div key={m.id}>{m.content}</div>
        ))}
      </div>
    </div>
  );
}
