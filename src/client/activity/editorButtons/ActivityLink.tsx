import { Button, message } from "antd";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { storeObserver } from "~/client/utils/storeObserver";
import { Status } from "../../utils/status";

export const ActivityLink = storeObserver(function ActivityLink({
  focusedActivityStore,
}) {
  const [copied, setCopied] = useState(false);
  const { activity } = focusedActivityStore;

  if (activity instanceof Status || activity.status !== "published") {
    return null;
  }

  const activityUrl = `${window.location.origin}/activity/${activity.id}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(activityUrl);
      setCopied(true);
      void message.success("Link copied to clipboard!");

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      void message.error("Failed to copy link");
    }
  };

  return (
    <Button onClick={copyToClipboard}>
      <span className="flex items-center gap-2">
        <span>Student link</span>
        <span>{copied ? <Check size={16} /> : <Copy size={16} />}</span>
      </span>
    </Button>
  );
});
