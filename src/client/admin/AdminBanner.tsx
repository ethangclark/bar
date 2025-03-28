"use client";

import { Button } from "antd";
import { useRouter } from "next/navigation";
import { useIsClientSide } from "../utils/isClientSide";
import { storeObserver } from "../utils/storeObserver";

export const AdminBanner = storeObserver(function AdminBanner({ userStore }) {
  const isClientSide = useIsClientSide();
  const router = useRouter();
  if (!isClientSide) {
    return null;
  }
  const { rootIsAdmin, impersonating } = userStore;
  if (!rootIsAdmin || impersonating === null) {
    return null;
  }
  return (
    <div className="absolute left-0 top-0 z-10 flex w-full justify-center bg-red-500">
      <Button
        type="text"
        className="w-full"
        onClick={() => {
          userStore.stopImpersonating();
          router.push("/admin");
        }}
      >
        Impersonating {impersonating.email}. Click to stop.
      </Button>
    </div>
  );
});
