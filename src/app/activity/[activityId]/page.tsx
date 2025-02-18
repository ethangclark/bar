"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { z } from "zod";
import { Activity } from "~/client/activity/Activity";
import { storeObserver } from "~/client/utils/storeObserver";

const ActivityPage = storeObserver(function ActivityPage({
  focusedActivityStore,
}) {
  const params = useParams();
  const { activityId } = z.object({ activityId: z.string() }).parse(params);

  useEffect(() => {
    void focusedActivityStore.loadActivity(activityId);
    return () => focusedActivityStore.reset();
  }, [focusedActivityStore, activityId]);

  return <Activity />;
});

// I hate Next.js
const Wrapped = () => <ActivityPage />;

export default Wrapped;
