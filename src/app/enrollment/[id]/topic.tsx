import { Dropdown, type MenuProps, Spin } from "antd";
import { useEffect, useMemo, useState } from "react";
import { PreformattedText } from "~/app/_components/PreformattedText";
import { useCss } from "~/app/_hooks/useCss";
import { formatDateTime } from "~/common/utils/timeUtils";
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
  const { mutateAsync: createSession, isPending: isCreatingSession } =
    api.tutoringSession.createTutoringSession.useMutation();
  useEffect(() => {
    if (selectedSession) {
      return;
    }
    async function effect() {
      const session = await createSession({
        enrollmentId,
        topicContext,
      });
      await refetchTutoringSessions();
      setSelectedSession(session);
    }
    void effect();
  }, [
    createSession,
    enrollmentId,
    refetchTutoringSessions,
    selectedSession,
    topicContext,
  ]);
  return { isCreatingSession, selectedSession, setSelectedSession };
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
  const { courseType, unit, module, topic } = topicContext;

  const { isCreatingSession, selectedSession, setSelectedSession } =
    useSelectedSession({
      enrollmentId,
      topicContext,
      topicTutoringSessions,
      refetchTutoringSessions,
    });

  const { isLoading: areMessagesLoading, data: messages } =
    api.tutoringSession.chatMessages.useQuery({
      tutoringSessionId: selectedSession?.id ?? null,
    });

  const menuItems = useMemo((): MenuProps["items"] => {
    return topicTutoringSessions.map((session) => ({
      key: session.id,
      label: formatDateTime(session.createdAt),
      onClick: () => setSelectedSession(session),
    }));
  }, [setSelectedSession, topicTutoringSessions]);

  // TODO: this isn't working
  const { id: dropdownWrapperId } = useCss(
    (id) =>
      `#${id} .ant-dropdown-menu { max-height: 200px; overflow-y: auto; }`,
  );

  return (
    <div
      className="mb-2 flex h-full w-full flex-col px-8"
      style={{ width: 672 }}
    >
      <div>
        {courseType.name} &gt; {unit.name} &gt; {module.name}
      </div>
      <div className="text-2xl">{topic.name}</div>
      <div className="mb-4 text-sm" id={dropdownWrapperId}>
        <Dropdown
          menu={{
            items: menuItems,
          }}
        >
          <span>
            {selectedSession ? formatDateTime(selectedSession.createdAt) : " "}
          </span>
        </Dropdown>
      </div>
      <div className="outline-3 h-full w-full rounded-3xl p-8 outline outline-gray-200">
        {messages?.map((m) => {
          if (m.senderRole === "user") {
            return (
              <div key={m.id} className="rounded-xl bg-blue-100 p-4">
                <PreformattedText>{m.content}</PreformattedText>
              </div>
            );
          }
          return (
            <div key={m.id} className="text-sm">
              <PreformattedText key={m.id}>{m.content}</PreformattedText>
            </div>
          );
        })}
        <div className="flex w-full justify-center">
          {isCreatingSession || areMessagesLoading ? <Spin /> : null}
        </div>
      </div>
    </div>
  );
}
