import { useCallback, useState } from "react";
import { Editor } from "../components/Editor";
import { VoiceTranscriber } from "../components/VoiceTranscriber";
import { storeObserver } from "../utils/storeObserver";
import { Status } from "../utils/status";

export const ChatInput = storeObserver<{
  messageProcessing: boolean;
  setMessageProcessing: (messageProcessing: boolean) => void;
}>(function ChatInput({
  messageProcessing,
  setMessageProcessing,
  descendentStore,
  threadStore,
}) {
  const { selectedThreadId } = threadStore;

  const [v, setV] = useState("");

  const onTranscription = useCallback((text: string) => {
    setV((v) => (v ? v + " " + text : text));
  }, []);

  return (
    <div
      style={{
        width: "calc(100% - 2px)",
      }}
    >
      <div className="mb-2 flex">
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

            setMessageProcessing(true);
            setV("");
            try {
              await descendentStore.create("messages", {
                content: v,
                senderRole: "user",
                threadId: selectedThreadId,
              });
            } finally {
              setMessageProcessing(false);
            }
          }}
          disabled={selectedThreadId instanceof Status || messageProcessing}
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
