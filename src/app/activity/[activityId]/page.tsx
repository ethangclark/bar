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
      {/* TOOD: weave together editor and assignment taker views somehow,
      taking into account course.enrolledAs fields */}
      <ActivityEditor activityId={activityId} />
    </Page>
  );
}
