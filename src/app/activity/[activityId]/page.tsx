"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { z } from "zod";
import { Activity } from "~/client/activity/Activity";
import { storeObserver } from "~/client/utils/storeObserver";
import { redirectQueryParam } from "~/common/constants";
import { api } from "~/trpc/react";

const ActivityPage = storeObserver(function ActivityPage({
  focusedActivityStore,
}) {
  const params = useParams();
  const { activityId } = z.object({ activityId: z.string() }).parse(params);

  const router = useRouter();

  const { data: isLoggedIn } = api.auth.isLoggedIn.useQuery();

  useEffect(() => {
    if (isLoggedIn === true) {
      void focusedActivityStore.loadActivity(activityId);
    } else if (isLoggedIn === false) {
      router.push(
        `/login?${redirectQueryParam}=${encodeURIComponent(
          window.location.pathname,
        )}`,
      );
    }
    return () => focusedActivityStore.reset();
  }, [focusedActivityStore, activityId, isLoggedIn, router]);

  return <Activity />;
});

// I hate Next.js
const Wrapped = () => <ActivityPage />;

export default Wrapped;
