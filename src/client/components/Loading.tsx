import { Spin } from "antd";
import { Page } from "./Page";

export const Loading = () => <Spin />;

export const CenteredLoading = () => (
  <div className="flex h-full w-full items-center justify-center">
    <Spin />
  </div>
);

export function LoadingPage() {
  return (
    <Page>
      <CenteredLoading />
    </Page>
  );
}
