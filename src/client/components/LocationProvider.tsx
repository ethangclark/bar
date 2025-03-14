"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { storeObserver } from "../utils/storeObserver";

export const LocationProvider = storeObserver<{
  children: React.ReactNode;
}>(function LocationProvider({ children, locationStore }) {
  const pathname = usePathname();
  useEffect(() => {
    locationStore._onPathnameChange();
  }, [locationStore, pathname]);

  const searchParams = useSearchParams();
  useEffect(() => {
    locationStore._onSearchParamChange();
  }, [locationStore, searchParams]);

  return <>{children}</>;
});
