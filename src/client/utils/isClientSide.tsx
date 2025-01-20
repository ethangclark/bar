"use client";
import { useEffect, useState } from "react";

export function useIsClientSide() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
