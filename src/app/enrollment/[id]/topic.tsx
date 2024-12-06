import { Dropdown, type MenuProps, Spin, Modal, Button } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Editor } from "~/app/_components/Editor";
import { PreformattedText } from "~/app/_components/PreformattedText";
import { useCss } from "~/app/_hooks/useCss";
import { formatDateTime } from "~/common/utils/timeUtils";
import { type TutoringSession, type TopicContext } from "~/server/db/schema";
import { api } from "~/trpc/react";
import confetti from "canvas-confetti";

function sortSessionsEarliestFirst(sessions: TutoringSession[]) {
  return sessions
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

function getMostRecentSession(sessions: TutoringSession[]) {
  return sortSessionsEarliestFirst(sessions).slice().pop() ?? null;
}

function Message({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
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
  refetchTutoringSessions: () => Promise<TutoringSession[]>;
}) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    () => getMostRecentSession(topicTutoringSessions)?.id ?? null,
  );
  // if selectedSessionId does not correspond to an available session, clear it
  useEffect(() => {
    if (
      selectedSessionId &&
      !topicTutoringSessions.some((s) => s.id === selectedSessionId)
    ) {
      setSelectedSessionId(null);
    }
  }, [selectedSessionId, topicTutoringSessions]);
  // if sessions are available but none are selected, select the most recent one
  useEffect(() => {
    if (!selectedSessionId && topicTutoringSessions.length > 0) {
      setSelectedSessionId(
        getMostRecentSession(topicTutoringSessions)?.id ?? null,
      );
    }
  }, [selectedSessionId, topicTutoringSessions]);

  const { mutateAsync: createSession, isPending: isCreatingSession } =
    api.tutoringSession.createTutoringSession.useMutation();

  const startNewSession = useCallback(async () => {
    setSelectedSessionId(null);
    await createSession({
      enrollmentId,
      topicContext,
    });
    const newSessions = await refetchTutoringSessions();
    setSelectedSessionId(getMostRecentSession(newSessions)?.id ?? null);
  }, [createSession, enrollmentId, refetchTutoringSessions, topicContext]);

  // if there are no sessions available, start a new one
  useEffect(() => {
    if (topicTutoringSessions.length === 0) {
      void startNewSession();
    }
  }, [startNewSession, topicTutoringSessions.length]);

  // materialize this based on ID and the live list of sessions so it remains up-to-date
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

function getSessionLabel(session: TutoringSession, idx: number) {
  return `Session ${idx + 1}: ${formatDateTime(session.createdAt)}`;
}

export function Topic({
  enrollmentId,
  topicContext,
  topicTutoringSessions,
  refetchTutoringSessions,
  onTopicComplete,
}: {
  enrollmentId: string;
  topicContext: TopicContext;
  topicTutoringSessions: TutoringSession[];
  refetchTutoringSessions: () => Promise<TutoringSession[]>;
  onTopicComplete: () => void;
}) {
  const { courseType, unit, module, topic } = topicContext;

  const sessionsEarliestFirst = useMemo(
    () => sortSessionsEarliestFirst(topicTutoringSessions),
    [topicTutoringSessions],
  );

  const {
    isCreatingSession,
    selectedSession,
    setSelectedSessionId,
    startNewSession,
  } = useSelectedSession({
    enrollmentId,
    topicContext,
    topicTutoringSessions,
    refetchTutoringSessions,
  });

  const {
    isLoading: areMessagesLoading,
    data: messages,
    refetch: refetchMessages,
  } = api.tutoringSession.chatMessages.useQuery({
    tutoringSessionId: selectedSession?.id ?? null,
  });

  const menuItems = useMemo((): MenuProps["items"] => {
    return sessionsEarliestFirst
      .map((session, idx) => ({
        key: session.id,
        label: getSessionLabel(session, idx),
        onClick: () => setSelectedSessionId(session.id),
      }))
      .reverse();
  }, [setSelectedSessionId, sessionsEarliestFirst]);

  // TODO: this isn't working
  const { id: dropdownWrapperId } = useCss(
    (id) =>
      `#${id} .ant-dropdown-menu { max-height: 200px; overflow-y: auto; }`,
  );

  const [v, setV] = useState("");

  const { mutateAsync: sendMessage, isPending: sendingMessage } =
    api.tutoringSession.sendMessage.useMutation();

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (selectedSession?.demonstratesMastery) {
      void confetti({
        spread: 100,
        startVelocity: 40,
      });
      setModalOpen(true);
    }
  }, [selectedSession?.demonstratesMastery]);

  const isLoading = isCreatingSession || areMessagesLoading || sendingMessage;

  const onCancel = useCallback(async () => {
    if (isLoading) {
      return;
    }
    await startNewSession();
    setModalOpen(false);
  }, [isLoading, startNewSession]);

  return (
    <div
      className="mb-2 flex h-full w-full flex-col items-center px-8"
      style={{ width: 672 }}
    >
      <Modal
        title="Module complete"
        open={modalOpen}
        onOk={onTopicComplete}
        onCancel={onCancel}
        footer={[
          isLoading && <Spin key="spin" className="mr-4" />,
          <Button key="cancel" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={onTopicComplete}
            disabled={isLoading}
          >
            OK
          </Button>,
        ]}
      >
        <p>Great job! You've demonstrated mastery of this topic.</p>
        <p>
          Click "OK" to move to the next topic, or "Cancel" to start another
          session on this topic.
        </p>
      </Modal>
      <div className="self-start">
        <div>
          {courseType.name} &gt; {unit.name} &gt; {module.name}
        </div>
        <div className="mb-2 text-2xl">{topic.name}</div>
        <div className="mb-4 text-sm" id={dropdownWrapperId}>
          <Dropdown.Button
            menu={{
              items: menuItems,
            }}
          >
            <span>
              {selectedSession &&
                getSessionLabel(
                  selectedSession,
                  sessionsEarliestFirst
                    .map((s) => s.id)
                    .indexOf(selectedSession.id),
                )}
            </span>
          </Dropdown.Button>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div
          className="outline-3 flex h-full w-full items-center overflow-y-auto rounded-3xl p-4 outline outline-gray-200"
          style={{ height: `calc(100vh - 280px)` }}
        >
          <div className="flex h-full w-full flex-col overflow-y-auto p-4">
            {messages?.map((m, idx) => {
              if (m.senderRole === "system") {
                return null;
              }

              // if subsequent message is system message, and no user messages before it,
              // then this is a "lesson prep" message and shoud be hidden
              if (
                m.senderRole === "assistant" &&
                messages[idx + 1]?.senderRole === "system" &&
                messages.slice(0, idx).every((m) => m.senderRole !== "user")
              ) {
                return null;
              }

              if (m.senderRole === "user") {
                return (
                  <Message key={m.id}>
                    <div className="self-end rounded-xl bg-blue-100 p-3">
                      <PreformattedText>{m.content}</PreformattedText>
                    </div>
                  </Message>
                );
              }
              return (
                <Message key={m.id}>
                  <div className="text-sm">
                    <PreformattedText key={m.id}>{m.content}</PreformattedText>
                  </div>
                </Message>
              );
            })}
            <div className="flex w-full justify-center">
              {isLoading ? (
                <div className="text-gray-500">
                  Thinking helpful thoughts... One minute... <Spin />
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div
          style={{
            height: 100,
            position: "relative",
            bottom: 0,
            width: 562,
            marginTop: 24,
            marginBottom: -100,
          }}
        >
          <Editor
            value={v}
            setValue={setV}
            placeholder="Compose your response"
            height={70}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!selectedSession || isLoading) return; // do nothing :/
                const { masteryDemonstrated } = await sendMessage({
                  tutoringSessionId: selectedSession.id,
                  content: v,
                });
                await refetchMessages();
                setV("");
                if (masteryDemonstrated) {
                  // this will reload the tutoring sessions so we get the update to the `masteryDemonstrated` field
                  await refetchTutoringSessions();
                }
              }
            }}
            disabled={sendingMessage}
          />
        </div>
      </div>
    </div>
  );
}
