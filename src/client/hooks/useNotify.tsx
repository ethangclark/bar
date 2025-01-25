import { notification } from "antd";
import { useCallback } from "react";

export type Notify = (params: { title: string; description: string }) => void;

export function useNotify(): [Notify, React.ReactNode] {
  const [api, contextHolder] = notification.useNotification();

  const notify: Notify = useCallback(
    ({ title, description }: { title: string; description: string }) => {
      api.info({
        message: title,
        description,
        icon: <div></div>,
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
