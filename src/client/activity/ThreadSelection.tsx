import { Button, Select, Typography } from "antd";
import { useEffect } from "react";
import { z } from "zod";
import { Status } from "~/client/utils/status";
import { formatDateTime } from "~/common/timeUtils";
import { LoadingCentered } from "../components/Loading";
import { TeacherSection } from "../components/TeacherSection";
import { storeObserver } from "../utils/storeObserver";

export const ThreadSelection = storeObserver(function ThreadSelection({
  threadStore,
  studentModeStore,
}) {
  const { sortedThreads, selectedThreadId } = threadStore;

  useEffect(() => {
    threadStore.ensureThreadSelection();
  }, [threadStore]);

  if (sortedThreads instanceof Status) {
    return <LoadingCentered />;
  }

  return (
    <TeacherSection className="mb-4 w-full px-4 pb-4 pt-1.5">
      <div className="mb-1">
        <Typography.Link
          onClick={() => studentModeStore.setIsStudentMode(false)}
        >
          ← Back to design
        </Typography.Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <Select
          className="grow"
          value={selectedThreadId}
          options={sortedThreads.map((t) => ({
            label: `Chat created on ${formatDateTime(t.createdAt)}`,
            value: t.id,
          }))}
          onChange={(value) =>
            threadStore.selectThread(z.string().parse(value))
          }
        />
        <Button onClick={() => threadStore.createThread()}>New chat</Button>
      </div>
    </TeacherSection>
  );
});
