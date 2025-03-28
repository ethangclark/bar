import { useEffect, useMemo, useState } from "react";
import { assertTypesExhausted } from "~/common/assertions";
import { type Message } from "~/server/db/schema";
import { Image } from "../components/Image";
import { PreformattedText } from "../components/PreformattedText";
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
}) {
  const children = viewPieceStore.viewPieceChildren(message.id);

  const flags = descendentStore.get("flags");
  const flag = useMemo(() => {
    if (isStatus(flags)) {
      return null;
    }
    return flags.find((f) => f.messageId === message.id) ?? null;
  }, [flags, message.id]);

  if (children) {
    return (
      <>
        {children.map((child, i) => {
          switch (child.type) {
            case "image":
              return (
                <MessageView
                  key={child.key}
                  isLastMessage={isLastMessage && i === children.length - 1}
                  messageLength={child.url.length}
                  scrollToBottom={scrollToBottom}
                  flag={flag}
                >
                  <Image alt={child.textAlternative} url={child.url} />
                </MessageView>
              );
            case "video":
              return (
                <MessageView
                  key={child.key}
                  isLastMessage={isLastMessage && i === children.length - 1}
                  messageLength={child.textAlternative.length}
                  scrollToBottom={scrollToBottom}
                  flag={flag}
                >
                  <Video videoId={child.videoId} />
                </MessageView>
              );
            case "text":
              return (
                <MessageView
                  key={child.key}
                  isLastMessage={isLastMessage && i === children.length - 1}
                  messageLength={child.content.length}
                  scrollToBottom={scrollToBottom}
                  flag={flag}
                >
                  <PreformattedText>{child.content}</PreformattedText>
                </MessageView>
              );
            default:
              assertTypesExhausted(child);
          }
        })}
      </>
    );
  } else {
    return (
      <MessageView
        isLastMessage={isLastMessage}
        messageLength={message.content.length}
        scrollToBottom={scrollToBottom}
        flag={flag}
        footer={
          message.doneGenerating ? undefined : (
            <div className="bg-white opacity-50">
              Thinking
              <FancyEllipsis />
            </div>
          )
        }
      >
        <PreformattedText
          className={
            message.doneGenerating ? "" : "max-w-[300px] text-xs opacity-50"
          }
        >
          {message.content}
        </PreformattedText>
      </MessageView>
    );
  }
});
