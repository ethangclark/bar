import { Button } from "antd";
import { useEffect, useMemo, useState } from "react";
import { assertTypesExhausted } from "~/common/assertions";
import { type Message } from "~/server/db/schema";
import { RichText } from "../components/editor/RichText";
import { Image } from "../components/Image";
import { Video } from "../components/Video";
import { isStatus } from "../utils/status";
import { storeObserver } from "../utils/storeObserver";
import { MessageView } from "./MessageView";

interface FancyEllipsisProps {
  /** Interval in milliseconds between dot updates (default: 500ms) */
  interval?: number;
  /** Maximum number of dots (default: 3) */
  maxDots?: number;
  /** Optional extra Tailwind CSS classes */
  className?: string;
}

const FancyEllipsis: React.FC<FancyEllipsisProps> = ({
  interval = 500,
  maxDots = 3,
  className = "",
}) => {
  // Start with one dot.
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      // Cycle the dot count from 1 to maxDots.
      setDotCount((prev) => (prev % maxDots) + 1);
    }, interval);

    return () => clearInterval(timer);
  }, [interval, maxDots]);

  return (
    <span className={`inline-block ${className}`}>{".".repeat(dotCount)}</span>
  );
};

function Thinking({
  children,
  scrollToBottom,
}: {
  children: React.ReactNode;
  scrollToBottom: () => void;
}) {
  const [viewingContent, setViewingContent] = useState(false);
  return (
    <div className="flex flex-col items-start">
      {viewingContent && (
        <div className="my-2 rounded-lg border-2 border-dotted border-gray-400 p-2 text-sm text-gray-600">
          {children}
        </div>
      )}
      <div
        onClick={() => {
          setViewingContent(!viewingContent);
          scrollToBottom();
        }}
      >
        <span className="flex flex-col">
          <span className="flex pl-1.5 text-gray-700">
            Thinking
            <FancyEllipsis />
          </span>
          <Button type="text" className="text-xs text-gray-500" size="small">
            {viewingContent ? "Hide" : "See"} thoughts
          </Button>
        </span>
      </div>
    </div>
  );
}

export const AssistantMessage = storeObserver<{
  message: Message;
  isLastMessage: boolean;
  scrollToBottom: () => void;
}>(function AssistantMessage({
  message,
  isLastMessage,
  scrollToBottom,
  viewPieceStore,
  descendentStore,
  diagnosticsStore,
}) {
  const children = viewPieceStore.viewPieceChildren(message.id);

  const flags = descendentStore.get("flags");
  const flag = useMemo(() => {
    if (isStatus(flags)) {
      return null;
    }
    return flags.find((f) => f.messageId === message.id) ?? null;
  }, [flags, message.id]);

  const { diagnosticsEnabled } = diagnosticsStore;

  return (
    <>
      {message.status !== "incomplete" &&
        children?.map((child, i) => {
          const isLastChild = i === children.length - 1;
          const isLast = isLastMessage && isLastChild;
          switch (child.type) {
            case "image":
              return (
                <MessageView
                  key={child.key}
                  id={isLastChild ? message.id : undefined}
                  messageId={message.id}
                  isLastMessage={isLast}
                  messageLength={child.url.length}
                  scrollToBottom={scrollToBottom}
                  flag={isLastChild ? flag : null}
                  diagnosticMessage="ASSISTANT MESSAGE - IMAGE"
                  complete
                >
                  <Image alt={child.textAlternative} url={child.url} />
                </MessageView>
              );
            case "video":
              return (
                <MessageView
                  key={child.key}
                  id={isLastChild ? message.id : undefined}
                  messageId={message.id}
                  isLastMessage={isLast}
                  messageLength={child.textAlternative.length}
                  scrollToBottom={scrollToBottom}
                  flag={isLastChild ? flag : null}
                  diagnosticMessage="ASSISTANT MESSAGE - VIDEO"
                  complete
                >
                  <Video videoId={child.videoId} />
                </MessageView>
              );
            case "text":
              return (
                <MessageView
                  key={child.key}
                  id={isLastChild ? message.id : undefined}
                  messageId={message.id}
                  isLastMessage={isLast}
                  messageLength={child.content.length}
                  scrollToBottom={scrollToBottom}
                  flag={isLastChild ? flag : null}
                  diagnosticMessage="ASSISTANT MESSAGE - TEXT"
                  complete
                >
                  <RichText value={child.content} />
                </MessageView>
              );
            default:
              assertTypesExhausted(child);
          }
        })}
      {(!children || diagnosticsEnabled) && (
        <MessageView
          id={message.id}
          messageId={message.id}
          isLastMessage={isLastMessage}
          messageLength={message.content.length}
          complete={message.status !== "incomplete"}
          scrollToBottom={scrollToBottom}
          flag={flag}
          diagnosticMessage="ASSISTANT MESSAGE - BASE"
        >
          {message.status === "incomplete" ? (
            <Thinking scrollToBottom={scrollToBottom}>
              {message.content}
            </Thinking>
          ) : (
            <RichText value={message.content} />
          )}
        </MessageView>
      )}
    </>
  );
});
