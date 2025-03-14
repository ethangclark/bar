"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { storeObserver } from "../utils/storeObserver";

export const HmrDejankProvider = storeObserver<{
  children: React.ReactNode;
}>(function HmrDejankProvider({ children, hmrStore }) {
  const pathname = usePathname();
  const pathNameRef = useRef(pathname);
  const { current: lastPathname } = pathNameRef;

  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  const { current: lastSearchParams } = searchParamsRef;

  useEffect(() => {
    if (
      process.env.NODE_ENV === "development" &&
      lastPathname === pathname &&
      lastSearchParams === searchParams
    ) {
      hmrStore.incrementHmrCount();
    }
    pathNameRef.current = pathname;
    searchParamsRef.current = searchParams;
  });

  return <>{children}</>;
});
