"use client";

import { scrollbarWidth } from "~/client/utils/scrollbarWidth";
import { useIsClientSide } from "~/client/utils/isClientSide";

export function Page({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const isClientSide = useIsClientSide();
  return (
    <div
      className={`flex flex-grow flex-col items-center px-2 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 ${className}`}
      style={{
        minWidth: `calc(100vw - ${isClientSide ? scrollbarWidth : 0}px)`,
      }}
    >
      {children}
    </div>
  );
}
