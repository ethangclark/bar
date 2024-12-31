import { Modal, Button, Spin } from "antd";
import { selectedTopicStore } from "./stores/selectedTopicStore";

interface TopicCompleteModalProps {
  open: boolean;
  isLoading: boolean;
  onCancel: () => void;
}

export function TopicCompleteModal({
  open,
  isLoading,
  onCancel,
}: TopicCompleteModalProps) {
  return (
    <Modal
      title="Module complete"
      open={open}
      onCancel={onCancel}
      footer={[
        isLoading && <Spin key="spin" className="mr-4" />,
        <Button key="remain" onClick={onCancel} disabled={isLoading}>
          Remain on this topic
        </Button>,
        <Button
          key="next"
          type="primary"
          onClick={() => selectedTopicStore.selectNextTopic()}
          disabled={isLoading}
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
}
