import { Spin } from "antd";
import { Centered } from "./Centered";
import { Page } from "./Page";

// not exported; should not use this directly
const Loading = () => <Spin />;

export const LoadingCentered = () => (
  <Centered>
    <Loading />
  </Centered>
);

export const LoadingNotCentered = () => <Loading />;

export function LoadingPage() {
  return (
    <Page>
      <LoadingCentered />
    </Page>
  );
}
