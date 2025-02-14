import { useEffect } from "react";

export function MessageView({
  children,
  className,
  isLastMessage,
  messageLength,
  scrollToBottom,
}: {
  children: React.ReactNode;
  className?: string;
  isLastMessage: boolean;
  messageLength: number;
  scrollToBottom: () => void;
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

  return <div className={`mb-4 flex ${className}`}>{children}</div>;
}
