"use client";

import { useParams } from "next/navigation";
import { z } from "zod";
import { ActivityEditor } from "~/client/activity/ActivityEditor";
import { Page } from "~/client/components/Page";

export default function ActivityPage() {
  const params = useParams();
  const { activityId } = z.object({ activityId: z.string() }).parse(params);

  return (
    <Page>
      <ActivityEditor activityId={activityId} />
    </Page>
  );
}
