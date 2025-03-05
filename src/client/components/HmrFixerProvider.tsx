"use client";

import "~/client/utils/hmrUtils";

export function HmrFixerProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
