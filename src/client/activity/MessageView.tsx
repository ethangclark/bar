import { useEffect } from "react";
import { type Flag } from "~/server/db/schema";
import { LinkStyle } from "../components/Link";
import { storeObserver } from "../utils/storeObserver";

export const MessageView = storeObserver<{
  children: React.ReactNode;
  className?: string;
  isLastMessage: boolean;
  messageLength: number;
  scrollToBottom: () => void;
  flag: Flag | null;
}>(function MessageView({
  descendentStore,
  children,
  className,
  isLastMessage,
  messageLength,
  scrollToBottom,
  flag,
}) {
  useEffect(() => {
    if (isLastMessage) {
      scrollToBottom();
    }
  }, [
    isLastMessage,
    scrollToBottom,
    // important to include messageLength in the dependency array
    // so we re-scroll to the bottom when the message content changes
    messageLength,
  ]);

  return (
    <div className={`mb-4 flex flex-col gap-1 ${className}`}>
      {children}
      {flag && (
        <LinkStyle
          className={`text-xs ${flag.unflagged ? "text-red-600" : ""}`}
          onClick={() => {
            void descendentStore.update("flags", {
              id: flag.id,
              unflagged: !flag.unflagged,
            });
          }}
        >
          {flag.unflagged
            ? "Message has been unflagged. Click here to re-flag."
            : "Message has been flagged. Click here to unflag."}
        </LinkStyle>
      )}
    </div>
  );
});
