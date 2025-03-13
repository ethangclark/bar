"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { z } from "zod";
import { Activity } from "~/client/activity/Activity";
import { storeObserver } from "~/client/utils/storeObserver";
import { searchParamsX } from "~/common/searchParams";
import { api } from "~/trpc/react";

const ActivityPage = storeObserver(function ActivityPage({
  focusedActivityStore,
  userStore,
}) {
  const params = useParams();
  const { activityId } = z.object({ activityId: z.string() }).parse(params);

  const router = useRouter();

  const { data } = api.auth.basicSessionDeets.useQuery();

  useEffect(() => {
    if (!data) {
      return;
    }
    const { isLoggedIn, user } = data;
    if (isLoggedIn === true) {
      void focusedActivityStore.loadActivity(activityId);
      user && userStore.setUser(user);
    } else if (isLoggedIn === false) {
      router.push(
        `/login?${searchParamsX.redirect.key}=${encodeURIComponent(
          window.location.pathname,
        )}`,
      );
    }
    return () => focusedActivityStore.reset();
  }, [focusedActivityStore, activityId, data, router, userStore]);

  return <Activity />;
});

// I hate Next.js
const Wrapped = () => <ActivityPage />;

export default Wrapped;
