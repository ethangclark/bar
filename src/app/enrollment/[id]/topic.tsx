import { Dropdown, type MenuProps, Spin, Modal, Button } from "antd";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Editor } from "~/app/_components/Editor";
import { PreformattedText } from "~/app/_components/PreformattedText";
import { useCss } from "~/app/_hooks/useCss";
import { formatDateTime } from "~/common/utils/timeUtils";
import { type TutoringSession, type TopicContext } from "~/server/db/schema";
import { api } from "~/trpc/react";
import confetti from "canvas-confetti";
import { VoiceRecorder } from "../voiceRecorder";
import { type AudioData } from "~/common/utils/types";

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

  // if there are no sessions available, start a new one
  useEffect(() => {
    if (topicTutoringSessions.length === 0) {
      void startNewSession(null);
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
  topLeftCorner,
}: {
  enrollmentId: string;
  topicContext: TopicContext;
  topicTutoringSessions: TutoringSession[];
  refetchTutoringSessions: () => Promise<TutoringSession[]>;
  onTopicComplete: () => void;
  topLeftCorner: ReactNode;
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

  const { mutateAsync: transcribe, isPending: isTranscribing } =
    api.trascription.transcribe.useMutation();

  const [v, setV] = useState("");

  const handleAudioData = useCallback(
    async (audioData: AudioData) => {
      const perMinute = 160 * 1000; // same logic is in transcriptionRouter.ts
      if (audioData.data.length > perMinute * 10) {
        throw new Error("Audio data exceeds max supported length");
      }

      const { text } = await transcribe(audioData);
      setV((v) => (v ? v + " " + text : text));
    },
    [transcribe],
  );

  const { mutateAsync: sendMessage, isPending: sendingMessage } =
    api.tutoringSession.sendMessage.useMutation();

  const [competionModalOpen, setCompletionModalOpen] = useState(false);
  const [sessionBumpModalOpen, setSessionBumpModalOpen] = useState(false);

  const isLoading = isCreatingSession || areMessagesLoading || sendingMessage;

  const onCancel = useCallback(async () => {
    if (isLoading) {
      return;
    }
    await startNewSession(
      "The student has demonstrated proficiency. Please continue tutoring them on the topic as they request.", // this string also exists in tutoringSessionRouter.ts
    );
    setCompletionModalOpen(false);
  }, [isLoading, startNewSession]);

  const messageWrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-full w-[350px] flex-col items-center px-2 md:w-[672px] md:px-8">
      <Modal
        title="Module complete"
        open={competionModalOpen}
        onCancel={onCancel}
        footer={[
          isLoading && <Spin key="spin" className="mr-4" />,
          <Button key="remain" onClick={onCancel} disabled={isLoading}>
            Remain on this topic
          </Button>,
          <Button
            key="next"
            type="primary"
            onClick={onTopicComplete}
            disabled={isLoading}
          >
            Next topic
          </Button>,
        ]}
      >
        <p>Great job! You've demonstrated mastery of this topic.</p>
        <p>
          Click "Next topic" to move to the next topic, or "Remain on this
          topic" to start another session on this topic.
        </p>
      </Modal>
      <Modal
        title="A new session is starting"
        open={sessionBumpModalOpen}
        footer={<></>}
      >
        <p className="mb-4">
          Maximum session length reached. Starting a new session that will pick
          up where you left off.
        </p>
        <div className="w-full text-center">
          <Spin />
        </div>
      </Modal>
      <div className="md:text-md w-full self-start text-sm">
        <div>
          <div className="flex w-full">
            <div>{topLeftCorner}</div>
            <div className="md:text-md flex-wrap items-center text-xs">
              {courseType.name} &gt; {unit.name} &gt; {module.name}
            </div>
          </div>
          <div className="mb-2 text-lg md:text-2xl">{topic.name}</div>
        </div>
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
      <div className="flex w-full flex-col items-center">
        <div
          className="outline-3 flex h-full w-full items-center overflow-y-auto rounded-3xl p-4 outline outline-gray-200"
          style={{ height: `calc(100vh - 300px)` }}
        >
          <div
            className="flex h-full w-full flex-col overflow-y-auto p-4"
            ref={messageWrapperRef}
          >
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
          className="w-[350px] md:w-[562px]"
          style={{
            height: 100,
            position: "relative",
            bottom: 0,
            marginTop: 20,
            marginBottom: -100,
          }}
        >
          <div className="mb-2 flex">
            <Editor
              value={v}
              setValue={setV}
              placeholder="Compose your message..."
              height={70}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!selectedSession || isLoading) return; // do nothing :/
                  const { masteryDemonstrated, conclusion } = await sendMessage(
                    {
                      tutoringSessionId: selectedSession.id,
                      content: v,
                    },
                  );
                  await refetchMessages();
                  setV("");
                  if (masteryDemonstrated) {
                    // this will reload the tutoring sessions so we get the update to the `masteryDemonstrated` field
                    await refetchTutoringSessions();
                    void confetti({
                      spread: 100,
                      startVelocity: 40,
                    });
                    setCompletionModalOpen(true);
                  }
                  if (!masteryDemonstrated && conclusion) {
                    setSessionBumpModalOpen(true);
                    await refetchTutoringSessions(); // reloads the session with conclusion populated
                    await startNewSession(conclusion);
                    setSessionBumpModalOpen(false);
                  }
                  setTimeout(() => {
                    // scroll to the bottom
                    messageWrapperRef.current?.scrollTo({
                      top: messageWrapperRef.current.scrollHeight,
                      behavior: "smooth",
                    });
                  });
                }
              }}
              disabled={sendingMessage || selectedSession?.conclusion !== null}
              className="mr-4"
            />
            <VoiceRecorder
              onRecordingComplete={handleAudioData}
              isProcessing={isTranscribing}
            />
          </div>
          <div className="w-full text-center text-xs text-gray-400">
            Press enter to send. Response may take a few seconds. Let the tutor
            know if you're done with the topic, or need help. Email questions
            and issues to hello@summited.ai
          </div>
        </div>
      </div>
    </div>
  );
}
