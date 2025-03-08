import { EllipsisOutlined } from "@ant-design/icons";
import { Button, Dropdown, Modal } from "antd";
import { useState } from "react";
import { storeObserver } from "~/client/utils/storeObserver";
import { assertTypesExhausted } from "~/common/assertions";
import { invoke } from "~/common/fnUtils";
import { type Activity } from "~/server/db/schema";
import { InfoModalPadding } from "../components/InfoModalPadding";
import { LoadingCentered } from "../components/Loading";

type PublishButtonProps = {
  activity: Activity;
};

const WrappedUnpublishButton = storeObserver(function WrappedUnpublishButton({
  editorStore,
  focusedActivityStore,
}) {
  const [confirmUnpublishOpen, setConfirmUnpublishOpen] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);

  const handleUnpublish = async () => {
    setUnpublishing(true);
    try {
      await focusedActivityStore.unpublish();
    } finally {
      setUnpublishing(false);
      setConfirmUnpublishOpen(false);
    }
  };

  const items = [
    {
      key: "unpublish",
      label: "Unpublish",
      disabled: !editorStore.canUnpublish,
      onClick: () => setConfirmUnpublishOpen(true),
    },
  ];

  return (
    <>
      <Modal
        open={confirmUnpublishOpen}
        onCancel={() => setConfirmUnpublishOpen(false)}
        onOk={handleUnpublish}
        okText="Unpublish"
      >
        <InfoModalPadding>
          Are you sure you want to unpublish this activity? This will make it
          invisible to students.
        </InfoModalPadding>
        <div className={unpublishing ? "" : "invisible"}>
          <LoadingCentered />
        </div>
      </Modal>
      <Dropdown menu={{ items }} placement="bottomRight">
        <Button icon={<EllipsisOutlined />} />
      </Dropdown>
    </>
  );
});

export const PublishButton = storeObserver<PublishButtonProps>(
  function PublishButton({ activity, editorStore, focusedActivityStore }) {
    const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
    const [publishing, setPublishing] = useState(false);
    return (
      <>
        <Modal
          open={confirmPublishOpen}
          onCancel={() => setConfirmPublishOpen(false)}
          onOk={async () => {
            setPublishing(true);
            try {
              await focusedActivityStore.publish();
            } finally {
              setPublishing(false);
              setConfirmPublishOpen(false);
            }
          }}
          okText="Publish"
        >
          <InfoModalPadding>
            Are you sure you want to publish this activity? This will make it
            visible to students.
          </InfoModalPadding>
          <div className={publishing ? "" : "invisible"}>
            <LoadingCentered />
          </div>
        </Modal>
        {invoke(() => {
          switch (activity.status) {
            case "draft":
              return (
                <Button
                  type="primary"
                  onClick={() => setConfirmPublishOpen(true)}
                  disabled={!editorStore.canPublish}
                >
                  Publish
                </Button>
              );
            case "published":
              return <WrappedUnpublishButton />;
            default:
              assertTypesExhausted(activity.status);
          }
        })}
      </>
    );
  },
);
