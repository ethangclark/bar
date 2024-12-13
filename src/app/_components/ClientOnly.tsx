"use client";
import { useEffect, useState, type ReactNode } from "react";

export function useIsForSureClientSide() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

export function ClientOnly({ children }: { children: ReactNode }) {
  const isClientSide = useIsForSureClientSide();

  if (!isClientSide) return null;

  return <>{children}</>;
}
