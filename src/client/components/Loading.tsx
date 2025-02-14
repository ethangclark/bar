import { Spin } from "antd";
import { Page } from "./Page";
import { Centered } from "./Centered";

// not exported; should not use this directly
const Loading = () => <Spin />;

export const LoadingCentered = () => (
  <Centered>
    <Loading />
  </Centered>
);

export function LoadingPage() {
  return (
    <Page>
      <LoadingCentered />
    </Page>
  );
}
