import { Button, Tooltip, Typography } from "antd";
import { CircleHelp } from "lucide-react";
import { storeObserver } from "../utils/storeObserver";

export const TeacherOptions = storeObserver(function TeacherOptions({
  threadStore,
  studentModeStore,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-between gap-2 rounded-lg border-2 border-dotted border-blue-500 p-2`}
    >
      <Typography.Link onClick={() => studentModeStore.setIsStudentMode(false)}>
        ← Back to design
      </Typography.Link>
      <Button
        className="w-full"
        onClick={async () => {
          await threadStore.createThread();
        }}
      >
        New chat
      </Button>
      <Button
        className="w-full"
        onClick={async () => {
          await threadStore.removeCompletions();
        }}
      >
        Reset progress
      </Button>
      <Tooltip
        title="These options only visible to teachers and developers."
        className="text-gray-500"
      >
        <CircleHelp size={16} />
      </Tooltip>
    </div>
  );
});
