"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { z } from "zod";
import { Activity } from "~/client/activity/Activity";
import { storeObserver } from "~/client/utils/storeObserver";
import { searchParamsX } from "~/common/searchParams";
import { trpc } from "~/trpc/proxy";

const ActivityPage = storeObserver(function ActivityPage({
  focusedActivityStore,
  userStore,
}) {
  const params = useParams();
  const { activityId } = z.object({ activityId: z.string() }).parse(params);

  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    void trpc.auth.basicSessionDeets.query().then(({ isLoggedIn, user }) => {
      if (!mounted) return;
      if (isLoggedIn === true) {
        void focusedActivityStore.loadActivity(activityId);
        user && userStore.setUser(user);
      } else if (isLoggedIn === false) {
        router.push(
          `/login?${searchParamsX.redirectUrl.key}=${encodeURIComponent(
            window.location.pathname,
          )}`,
        );
      }
    });
    return () => {
      mounted = false;
    };
  }, [activityId, focusedActivityStore, router, userStore]);

  useEffect(() => {
    return () => {
      focusedActivityStore.reset();
    };
  }, [focusedActivityStore]);

  return <Activity />;
});

// I hate Next.js
const Wrapped = () => <ActivityPage />;

export default Wrapped;
