"use client";

import { scrollbarWidth } from "~/client/utils/_utils/scrollbarWidth";
import { useIsForSureClientSide } from "./ClientOnly";

export function Page({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const isClientSide = useIsForSureClientSide();
  return (
    <div
      className={`flex flex-grow flex-col items-center px-2 py-5 sm:px-6 sm:py-10 md:px-8 md:py-12 ${className}`}
      style={{
        minWidth: `calc(100vw - ${isClientSide ? scrollbarWidth : 0}px)`,
      }}
    >
      {children}
    </div>
  );
}
