import { Button, Dropdown, message, Modal } from "antd";
import { Copy } from "lucide-react";
import { useCallback, useState } from "react";
import { storeObserver } from "~/client/utils/storeObserver";
import { assertTypesExhausted } from "~/common/assertions";
import { invoke } from "~/common/fnUtils";
import { type Activity } from "~/server/db/schema";
import { InfoModalPadding } from "../../components/InfoModalPadding";
import { LoadingCentered } from "../../components/Loading";
import { Status } from "../../utils/status";
import { type FocusedActivityStore } from "../stores/focusedActivityStore";

const useCopyStudentLink = (focusedActivityStore: FocusedActivityStore) => {
  const { activity } = focusedActivityStore;

  const copyToClipboard = useCallback(async () => {
    try {
      if (activity instanceof Status || activity.status !== "published") {
        throw new Error("Activity is not published");
      }
      const activityUrl = `${window.location.origin}/activity/${activity.id}`;
      await navigator.clipboard.writeText(activityUrl);
      void message.success("Link copied to clipboard!");
    } catch (err) {
      void message.error("Failed to copy link");
    }
  }, [activity]);

  return copyToClipboard;
};

const PublishedSharingOptions = storeObserver(function PublishedSharingOptions({
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

  const copy = useCopyStudentLink(focusedActivityStore);

  const items = [
    {
      key: "copy-student-link",
      label: (
        <span className="flex items-center gap-2">
          <span>Copy student activity link</span>
          <span>
            <Copy size={16} />
          </span>
        </span>
      ),
      onClick: copy,
    },
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
      <Dropdown.Button menu={{ items }}>Share</Dropdown.Button>
    </>
  );
});

const PublishButton = storeObserver(function PublishButton({
  editorStore,
  focusedActivityStore,
}) {
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
      <Button
        type="primary"
        onClick={() => setConfirmPublishOpen(true)}
        disabled={!editorStore.canPublish}
      >
        Publish
      </Button>
    </>
  );
});

export const SharingOptions = storeObserver<{ activity: Activity }>(
  function SharingOptions({ focusedActivityStore }) {
    const { activity } = focusedActivityStore;
    if (activity instanceof Status) {
      return null;
    }
    return (
      <>
        {invoke(() => {
          switch (activity.status) {
            case "draft":
              return <PublishButton />;
            case "published":
              return <PublishedSharingOptions />;
            default:
              assertTypesExhausted(activity.status);
          }
        })}
      </>
    );
  },
);
