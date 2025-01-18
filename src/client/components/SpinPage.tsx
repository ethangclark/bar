import { Spin } from "antd";
import { Page } from "./Page";

export function SpinPage() {
  return (
    <Page>
      <div className="flex h-full w-full items-center justify-center">
        <Spin />
      </div>
    </Page>
  );
}
