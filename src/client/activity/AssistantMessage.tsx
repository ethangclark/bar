import { type Message } from "~/server/db/schema";
import { PreformattedText } from "../components/PreformattedText";
import { storeObserver } from "../utils/storeObserver";
import { MessageView } from "./MessageView";

export const AssistantMessage = storeObserver<{
  message: Message;
  isLastMessage: boolean;
  scrollToBottom: () => void;
}>(function AssistantMessage({ message, isLastMessage, scrollToBottom }) {
  return (
    <MessageView
      isLastMessage={isLastMessage}
      messageLength={message.content.length}
      scrollToBottom={scrollToBottom}
    >
      <PreformattedText>{message.content}</PreformattedText>
    </MessageView>
  );
});
