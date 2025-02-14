import { useCallback, useState } from "react";
import { Editor } from "../components/Editor";
import { VoiceTranscriber } from "../components/VoiceTranscriber";
import { storeObserver } from "../utils/storeObserver";
import { Status } from "../utils/status";
import { LoadingCentered } from "../components/Loading";
export const ChatInput = storeObserver(function ChatInput({
  descendentStore,
  threadStore,
}) {
  const { selectedThreadId } = threadStore;

  const [v, setV] = useState("");
  const [isMessageSending, setIsMessageSending] = useState(false);

  const onTranscription = useCallback((text: string) => {
    setV((v) => (v ? v + " " + text : text));
  }, []);

  const { lastMessageComplete } = threadStore;

  const loading =
    selectedThreadId instanceof Status ||
    isMessageSending ||
    !lastMessageComplete;

  return (
    <div
      style={{
        width: "calc(100% - 2px)",
      }}
    >
      <div className="relative mb-2 flex">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingCentered />
          </div>
        )}
        <Editor
          value={v}
          setValue={setV}
          placeholder="Compose your message..."
          height={70}
          onKeyDown={async (e) => {
            if (e.key !== "Enter" || e.shiftKey) {
              return;
            }
            e.preventDefault();

            if (selectedThreadId instanceof Status) {
              return;
            }

            setIsMessageSending(true);
            setV("");
            try {
              await descendentStore.create("messages", {
                content: v,
                senderRole: "user",
                threadId: selectedThreadId,
                completed: true,
              });
            } finally {
              setIsMessageSending(false);
            }
          }}
          disabled={loading}
          className="mr-4"
        />
        <VoiceTranscriber onTranscription={onTranscription} />
      </div>
      <div className="w-full text-center text-xs text-gray-400">
        Press enter to send. Response may take a few seconds. Let Summit know if
        you want to move on to another part of the activity, or need help. Email
        questions and issues to hello@summited.ai
      </div>
    </div>
  );
});
