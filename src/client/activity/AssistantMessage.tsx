import { assertTypesExhausted } from "~/common/assertions";
import { type Message } from "~/server/db/schema";
import { Image } from "../components/Image";
import { PreformattedText } from "../components/PreformattedText";
import { storeObserver } from "../utils/storeObserver";
import { MessageView } from "./MessageView";

export const AssistantMessage = storeObserver<{
  message: Message;
  isLastMessage: boolean;
  scrollToBottom: () => void;
}>(function AssistantMessage({
  message,
  isLastMessage,
  scrollToBottom,
  viewPieceStore,
}) {
  const children = viewPieceStore.viewPieceChildren(message.id);

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
                >
                  <Image alt={child.textAlternative} url={child.url} />
                </MessageView>
              );
            case "text":
              return (
                <MessageView
                  key={child.key}
                  isLastMessage={isLastMessage && i === children.length - 1}
                  messageLength={child.content.length}
                  scrollToBottom={scrollToBottom}
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
      >
        <PreformattedText>{message.content}</PreformattedText>
      </MessageView>
    );
  }
});
