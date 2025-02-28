"use client";

import { useEffect } from "react";
import { subscribeToErrors } from "~/trpc/links";
import { useNotify } from "../hooks/useNotify";

export function ErrorDisplayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notify, contextHolder] = useNotify();
  useEffect(() => {
    subscribeToErrors({
      onError: (error) => {
        notify({
          type: "error",
          title: "Error",
          description: (
            <div>
              <div>{error.message}</div>
            </div>
          ),
        });
      },
    });
  }, [notify]);
  return (
    <>
      {contextHolder}
      {children}
    </>
  );
}
