import { Button, Form, Input, Modal } from "antd";
import { useState } from "react";
import { type MaybePromise } from "~/common/types";

export const createActivityButtonText = "Create activity";

export function CreateActivityButton({
  onCreate,
  small = false,
}: {
  onCreate: (title: string) => MaybePromise<void>;
  small?: boolean;
}) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");

  return (
    <>
      <Button
        size={small ? "small" : undefined}
        disabled={creating}
        onClick={() => {
          setCreating(true);
        }}
      >
        {createActivityButtonText}
      </Button>
      <Modal
        title="Create activity"
        open={creating}
        onCancel={() => setCreating(false)}
        onOk={async () => {
          await onCreate(title);
          setCreating(false);
          setTitle("");
        }}
        okText="Create"
        okButtonProps={{ disabled: title.length === 0 }}
      >
        <Form onFinish={onCreate}>
          <Input
            placeholder="Activity title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Form>
      </Modal>
    </>
  );
}
