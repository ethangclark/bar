"use client";

import { scrollbarWidth } from "~/app/_utils/scrollbarWidth";
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
      className={`flex flex-grow flex-col items-center px-8 py-12 ${className}`}
      style={{
        minWidth: `calc(100vw - ${isClientSide ? scrollbarWidth : 0}px)`,
      }}
    >
      {children}
    </div>
  );
}
