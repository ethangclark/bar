import { Tooltip, Typography } from "antd";
import { CircleHelp } from "lucide-react";
import { storeObserver } from "../utils/storeObserver";

export const TeacherOptions = storeObserver(function TeacherOptions({
  threadStore,
  viewModeStore,
  userStore,
}) {
  return (
    <div
      className={`flex items-center justify-center gap-4 rounded-lg border-2 border-dotted border-blue-500 px-4 py-1`}
    >
      <Typography.Link onClick={() => viewModeStore.setViewMode("editor")}>
        ← Back to design
      </Typography.Link>
      {userStore.impersonating ? (
        <Typography.Link onClick={() => userStore.stopImpersonating()}>
          Impersonating {userStore.impersonating.email}. Click to stop
          impersonating
        </Typography.Link>
      ) : (
        <Tooltip
          title="These options only visible to teachers and developers."
          className="text-gray-500"
        >
          <CircleHelp size={16} />
        </Tooltip>
      )}
      <Typography.Link
        onClick={async () => {
          await Promise.all([
            threadStore.removeCompletions(),
            threadStore.createThread(),
          ]);
        }}
      >
        Reset + new chat
      </Typography.Link>
    </div>
  );
});
