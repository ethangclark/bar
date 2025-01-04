import { Modal, Button } from "antd";
import { storeObserver } from "../utils/storeObserver";

export const TopicCompleteModal = storeObserver(function TopicCompleteModal({
  topicCompletionStore,
}) {
  return (
    <Modal
      title="Module complete"
      open={topicCompletionStore.completionModalOpen}
      onCancel={() =>
        topicCompletionStore.dismissCompletionModalAndStayOnPage()
      }
      footer={[
        <Button
          key="remain"
          onClick={() =>
            topicCompletionStore.dismissCompletionModalAndStayOnPage()
          }
        >
          Remain on this topic
        </Button>,
        <Button
          key="next"
          type="primary"
          onClick={() =>
            topicCompletionStore.dismissCompletionModalGoToNextTopic()
          }
        >
          Next topic
        </Button>,
      ]}
    >
      <p>Great job! You've demonstrated mastery of this topic.</p>
      <p>
        Click "Next topic" to move to the next topic, or "Remain on this topic"
        to start another session on this topic.
      </p>
    </Modal>
  );
});
