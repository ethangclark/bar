import { Modal, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { sessionBumpStore } from "./stores/sessionBumpStore";

export const SessionBumpModal = observer(function SessionBumpModal() {
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
