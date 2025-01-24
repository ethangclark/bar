"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { z } from "zod";
import { ActivityEditor } from "~/client/activity/ActivityEditor";
import { ActivityFrame } from "~/client/components/ActivityFrame";
import { LoadingCentered } from "~/client/components/Loading";
import { Page } from "~/client/components/Page";
import { storeObserver } from "~/client/utils/storeObserver";
import { Status } from "~/common/utils/status";

const ActivityPage = storeObserver(function ActivityPage({
  activityEditorStore,
}) {
  const params = useParams();
  const { activityId } = z.object({ activityId: z.string() }).parse(params);

  useEffect(() => {
    void activityEditorStore.loadActivity(activityId);
    return () => activityEditorStore.clearActivity();
  }, [activityEditorStore, activityId]);

  const { savedActivity } = activityEditorStore;

  return (
    <Page>
      {savedActivity instanceof Status ? (
        <LoadingCentered />
      ) : (
        <ActivityFrame
          privileged={(["teacher", "designer"] as const).some((v) =>
            savedActivity.course.enrolledAs.includes(v),
          )}
          privilegedHeader={<div>This be the teacher header</div>}
          baseHeader={<div>This be the student header</div>}
          rows={[
            {
              studentView: <div>This be the student view of row 1</div>,
              teacherView: <div>This be the teacher view of row 1</div>,
            },
            {
              studentView: <div>This be the student view of row 2</div>,
              teacherView: <div>This be the teacher view of row 2</div>,
            },
          ]}
          baseFooter={<div>This be the student footer</div>}
          privilegedFooter={<div>This be the teacher footer</div>}
        />
      )}
      <ActivityEditor />
    </Page>
  );
});

// I hate Next.js
const Wrapped = () => <ActivityPage />;

export default Wrapped;
