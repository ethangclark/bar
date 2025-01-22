"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { z } from "zod";
import { ActivityEditor } from "~/client/activity/ActivityEditor";
import { Page } from "~/client/components/Page";
import { storeObserver } from "~/client/utils/storeObserver";

const ActivityPage = storeObserver(function ActivityPage({
  activityEditorStore,
}) {
  const params = useParams();
  const { activityId } = z.object({ activityId: z.string() }).parse(params);

  useEffect(() => {
    void activityEditorStore.loadActivity(activityId);
    return () => activityEditorStore.clearActivity();
  }, [activityEditorStore, activityId]);

  return (
    <Page>
      {/* TOOD: weave together editor and assignment taker views somehow,
      taking into account course.enrolledAs fields */}
      <ActivityEditor />
    </Page>
  );
});

// I hate Next.js
const Wrapped = () => <ActivityPage />;

export default Wrapped;
