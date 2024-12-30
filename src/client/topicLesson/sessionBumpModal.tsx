import { Modal, Spin } from "antd";

interface SessionBumpModalProps {
  open: boolean;
}

export function SessionBumpModal({ open }: SessionBumpModalProps) {
  return (
    <Modal title="A new session is starting" open={open} footer={null}>
      <p className="mb-4">
        Maximum session length reached. Starting a new session that will pick up
        where you left off.
      </p>
      <div className="w-full text-center">
        <Spin />
      </div>
    </Modal>
  );
}
