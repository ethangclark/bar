import { useCallback, useState } from "react";
import { Editor } from "../components/Editor";
import { VoiceTranscriber } from "../components/VoiceTranscriber";
import { storeObserver } from "../utils/storeObserver";

export const ChatInput = storeObserver<{
  threadId: string;
  messageProcessing: boolean;
  setMessageProcessing: (messageProcessing: boolean) => void;
}>(function ChatInput({
  threadId,
  messageProcessing,
  setMessageProcessing,
  descendentStore,
}) {
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
            setMessageProcessing(true);
            setV("");
            try {
              await descendentStore.create("messages", {
                content: v,
                senderRole: "user",
                threadId,
              });
            } finally {
              setMessageProcessing(false);
            }
          }}
          disabled={messageProcessing}
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
