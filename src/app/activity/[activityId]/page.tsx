"use client";

import { useParams } from "next/navigation";
import { z } from "zod";
import { Page } from "~/client/components/Page";

export default function ActivityPage() {
  const params = useParams();
  const { activityId } = z.object({ activityId: z.string() }).parse(params);

  return <Page>{activityId}</Page>;
}
