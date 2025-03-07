import { Button, Modal, type ButtonProps } from "antd";
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

function ControlButton(props: ButtonProps) {
  return <Button {...props} className={`w-full ${props.className ?? ""}`} />;
}

const UnpublishButton = storeObserver<PublishButtonProps>(
  function UnpublishButton({ activity, editorStore, focusedActivityStore }) {
    const [confirmUnpublishOpen, setConfirmUnpublishOpen] = useState(false);
    const [unpublishing, setUnpublishing] = useState(false);
    return (
      <>
        <Modal
          open={confirmUnpublishOpen}
          onCancel={() => setConfirmUnpublishOpen(false)}
          onOk={async () => {
            setUnpublishing(true);
            try {
              await focusedActivityStore.unpublish();
            } finally {
              setUnpublishing(false);
              setConfirmUnpublishOpen(false);
            }
          }}
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
        {invoke(() => {
          switch (activity.status) {
            case "published":
              return (
                <ControlButton
                  onClick={() => setConfirmUnpublishOpen(true)}
                  disabled={!editorStore.canUnpublish}
                >
                  Unpublish
                </ControlButton>
              );
            case "draft":
              return null;
            default:
              assertTypesExhausted(activity.status);
          }
        })}
      </>
    );
  },
);

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
                <ControlButton
                  type="primary"
                  onClick={() => setConfirmPublishOpen(true)}
                  disabled={!editorStore.canPublish}
                >
                  Publish
                </ControlButton>
              );
            case "published":
              return <UnpublishButton activity={activity} />;
            default:
              assertTypesExhausted(activity.status);
          }
        })}
      </>
    );
  },
);
