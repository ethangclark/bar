import { Button, Select } from "antd";
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
    <TeacherSection className="mb-4 flex w-full flex-wrap justify-center gap-2 p-4">
      <Select
        className="grow"
        value={selectedThreadId}
        options={sortedThreads.map((t) => ({
          label: `Chat created on ${formatDateTime(t.createdAt)}`,
          value: t.id,
        }))}
        onChange={(value) => threadStore.selectThread(z.string().parse(value))}
      />
      <div className="flex gap-2">
        <Button onClick={() => threadStore.createThread()}>New chat</Button>
        <Button
          type="primary"
          onClick={() => studentModeStore.setIsStudentMode(false)}
        >
          Back to design
        </Button>
      </div>
    </TeacherSection>
  );
});
