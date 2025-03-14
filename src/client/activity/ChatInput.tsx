import { useCallback, useEffect, useRef, useState } from "react";
import { Editor } from "../components/Editor";
import { LoadingCentered } from "../components/Loading";
import { VoiceTranscriber } from "../components/VoiceTranscriber";
import { Status } from "../utils/status";
import { storeObserver } from "../utils/storeObserver";

export const ChatInput = storeObserver(function ChatInput({
  descendentStore,
  threadStore,
}) {
  const { thread } = threadStore;

  const [v, setV] = useState("");
  const [isMessageSending, setIsMessageSending] = useState(false);

  const onTranscription = useCallback((transcript: string) => {
    setV((v) => (v ? v + " " + transcript : transcript));
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  const { lastMessageComplete } = threadStore;

  const editorRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  const loading =
    thread instanceof Status || isMessageSending || !lastMessageComplete;

  const inputsDisabled = loading || threadStore.isOldThread;

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
          ref={editorRef}
          value={v}
          setValue={setV}
          placeholder="Compose your message..."
          height={70}
          onKeyDown={async (e) => {
            if (e.key !== "Enter" || e.shiftKey) {
              return;
            }
            e.preventDefault();

            if (thread instanceof Status) {
              return;
            }

            setIsMessageSending(true);
            setV("");
            try {
              await descendentStore.create("messages", {
                content: v,
                senderRole: "user",
                threadId: thread.id,
                doneGenerating: true,
              });
            } finally {
              setIsMessageSending(false);
              if (editorRef.current) {
                editorRef.current.focus();
              }
            }
          }}
          disabled={inputsDisabled}
          className="mr-4"
        />
        <VoiceTranscriber
          onTranscription={onTranscription}
          disabled={inputsDisabled}
        />
      </div>
      <div className="w-full text-center text-xs text-gray-400">
        Press enter to send. Response may take a few seconds. Let Summit know if
        you want to move on to another part of the activity, or need help. Email
        questions and issues to hello@summited.ai
      </div>
    </div>
  );
});
