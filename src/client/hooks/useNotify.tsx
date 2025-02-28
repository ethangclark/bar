import { notification } from "antd";
import { useCallback } from "react";
import { invoke } from "~/common/fnUtils";

export type Notify = (params: {
  title: React.ReactNode;
  description: React.ReactNode;
  type?: "info" | "success" | "warning" | "error";
}) => void;

export function useNotify(): [Notify, React.ReactNode] {
  const [api, contextHolder] = notification.useNotification();

  const notify: Notify = useCallback<Notify>(
    ({ title, description, type = "info" }) => {
      api.info({
        message: invoke(() => {
          switch (type) {
            case "info":
            case "success":
              return title;
            case "warning":
              return <span className="text-yellow-500">{title}</span>;
            case "error":
              return <span className="text-red-500">{title}</span>;
          }
        }),
        description,
        icon: <div></div>,
        type,
      });
    },
    [api],
  );

  return [notify, contextHolder];
}

export const comingSoonNotification = {
  title: "This feature is coming soon!",
  description: "Stay tuned 😄",
};
