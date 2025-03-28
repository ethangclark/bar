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
  footer?: React.ReactNode;
}>(function MessageView({
  descendentStore,
  children,
  className,
  isLastMessage,
  messageLength,
  scrollToBottom,
  flag,
  footer,
}) {
  useEffect(() => {
    if (isLastMessage) {
      // timeout allows images to render
      setTimeout(scrollToBottom);
    }
  }, [
    isLastMessage,
    scrollToBottom,
    // important to include messageLength in the dependency array
    // so we re-scroll to the bottom when the message content changes
    messageLength,
    // re-scroll if footer changes
    footer,
  ]);

  return (
    <div className={`flex flex-col gap-1 pb-4 ${className ?? ""}`}>
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
      {footer && (
        <div className="absolute relative bottom-0 left-0">{footer}</div>
      )}
    </div>
  );
});
