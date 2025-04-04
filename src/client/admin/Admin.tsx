import { Collapse } from "antd";
import { storeObserver } from "~/client/utils/storeObserver";
import { LogoutButton } from "../components/LogoutButton";
import { Flags } from "./Flags";

export const Admin = storeObserver(function Admin() {
  return (
    <div className="flex w-full flex-col">
      <div className="flex justify-end">
        <LogoutButton flushRight={false} />
      </div>
      <div className="mb-4 text-3xl font-bold">Admin</div>
      <Collapse
        items={[{ key: "flags", label: "Flags", children: <Flags /> }]}
      />
    </div>
  );
});
