import { Spin } from "antd";
import { Page } from "./Page";
import { Centered } from "./Centered";

export const Loading = () => <Spin />;

export const CenteredLoading = () => (
  <Centered>
    <Loading />
  </Centered>
);

export function LoadingPage() {
  return (
    <Page>
      <CenteredLoading />
    </Page>
  );
}
