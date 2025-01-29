"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { z } from "zod";
import { Activity } from "~/client/activity/Activity";
import { Page } from "~/client/components/Page";
import { storeObserver } from "~/client/utils/storeObserver";

const ActivityPage = storeObserver(function ActivityPage({
  activityEditorStore,
}) {
  const params = useParams();
  const { activityId } = z.object({ activityId: z.string() }).parse(params);

  useEffect(() => {
    void activityEditorStore.loadActivity(activityId);
    return () => activityEditorStore.reset();
  }, [activityEditorStore, activityId]);

  return (
    <Page>
      <Activity />
    </Page>
  );
});

// I hate Next.js
const Wrapped = () => <ActivityPage />;

export default Wrapped;
