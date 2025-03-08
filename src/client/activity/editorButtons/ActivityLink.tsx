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
    <div className="flex items-center gap-2">
      <div>Student link:</div>
      <span className="flex items-center gap-2">
        <Button
          onClick={copyToClipboard}
          type="link"
          className="rounded-md border border-gray-300 px-2 py-1"
        >
          {activityUrl}
        </Button>
        <Button onClick={copyToClipboard} type="link" className="px-0">
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </Button>
      </span>
    </div>
  );
});
