"use client";

import { Button } from "antd";
import { useRouter } from "next/navigation";
import { useIsClientSide } from "../utils/isClientSide";
import { storeObserver } from "../utils/storeObserver";

export const AdminBanner = storeObserver(function AdminBanner({
  userStore,
  locationStore,
}) {
  const isClientSide = useIsClientSide();
  const router = useRouter();
  const messageId = locationStore.searchParam("messageId");
  if (!isClientSide) {
    return null;
  }
  const { rootIsAdmin, impersonating } = userStore;
  if (!rootIsAdmin || impersonating === null) {
    return null;
  }
  return (
    <div className="absolute left-0 top-0 z-10 flex w-full items-center justify-center gap-2 bg-red-400">
      <span>Impersonating {impersonating.email}.</span>
      <Button
        size="small"
        type="text"
        onClick={() => {
          userStore.stopImpersonating();
          router.push("/admin");
        }}
      >
        Return to admin
      </Button>
      {messageId && (
        <Button
          size="small"
          type="text"
          onClick={() => {
            const el = document.getElementById(messageId);
            if (el) {
              el.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          Scroll to message
        </Button>
      )}
    </div>
  );
});
