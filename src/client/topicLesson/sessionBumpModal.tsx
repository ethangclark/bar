import { Modal, Spin } from "antd";
import { storeObserver } from "../utils/storeObserver";

export const SessionBumpModal = storeObserver(function SessionBumpModal({
  sessionBumpStore,
}) {
  return (
    <Modal
      title="A new session is starting"
      open={sessionBumpStore.bumpingNotificationModalOpen}
      footer={null}
    >
      <p className="mb-4">
        Maximum session length reached. Starting a new session that will pick up
        where you left off.
      </p>
      <div className="w-full text-center">
        <Spin />
      </div>
    </Modal>
  );
});
