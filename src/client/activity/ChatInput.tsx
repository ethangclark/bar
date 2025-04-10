import { useCallback, useEffect, useRef, useState } from "react";
import { Editor } from "../components/editor/Editor";
import { EditorTextButton } from "../components/editor/EditorTextButton";
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

  const initialMessageSent = useRef(false);

  useEffect(() => {
    if (initialMessageSent.current && !inputsDisabled) {
      editorRef.current?.focus();
    }
  }, [inputsDisabled]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (thread instanceof Status) return;
      setIsMessageSending(true);
      await descendentStore.create("messages", {
        content,
        senderRole: "user",
        threadId: thread.id,
        status: "completeWithoutViewPieces",
      });
      initialMessageSent.current = true;
      setIsMessageSending(false);
    },
    [descendentStore, thread],
  );

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
        <div className="flex w-full flex-col pr-4">
          <Editor
            ref={editorRef}
            value={v}
            onChange={setV}
            placeholder="Compose your message..."
            minHeight={70}
            onKeyDown={async (e) => {
              if (e.key !== "Enter" || e.shiftKey) return;
              e.preventDefault();
              if (thread instanceof Status) return;
              setV("");
              await sendMessage(v);
            }}
            disabled={inputsDisabled}
            lowerLeftButton={
              <div className="flex items-center">
                <EditorTextButton
                  onClick={async () => {
                    await sendMessage("Please continue");
                  }}
                >
                  Click or tap <span className="mx-[-0px] font-bold">here</span>{" "}
                  to send "Please continue"
                </EditorTextButton>
              </div>
            }
          />
        </div>
        <VoiceTranscriber
          onTranscription={onTranscription}
          disabled={inputsDisabled}
        />
      </div>
      <div>
        <div className="w-full text-center text-xs text-gray-400">
          Press enter to send. Let Summit know if something is confusing or you
          need help.
        </div>
        <div className="w-full text-center text-xs text-gray-400">
          You can contact the creators of Summit at hello@summited.ai.
        </div>
      </div>
    </div>
  );
});
