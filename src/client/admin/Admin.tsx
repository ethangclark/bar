import { Table } from "antd";
import { storeObserver } from "~/client/utils/storeObserver";
import { objectValues } from "~/common/objectUtils";
import { type Flag } from "~/server/db/schema";
import { api } from "~/trpc/react";
import { LoadingCentered } from "../components/Loading";
import { Title } from "../components/Title";

type ColumnBases = Partial<{
  [Key in keyof Flag]: {
    title: string;
    dataIndex: Key;
    key: Key;
    render?: (value: Flag[Key]) => React.ReactNode;
  };
}>;

const columnBases = {
  adminChecked: {
    title: "Checked",
    dataIndex: "adminChecked",
    key: "adminChecked",
    render: (adminChecked: boolean) => (adminChecked ? "Yes" : "No"),
  },
  createdAt: {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (createdAt: Date) => createdAt.toLocaleString(),
  },
  id: {
    title: "Flag ID",
    dataIndex: "id",
    key: "id",
  },
  activityId: {
    title: "Activity ID",
    dataIndex: "activityId",
    key: "activityId",
  },
  reason: {
    title: "Reason",
    dataIndex: "reason",
    key: "reason",
  },
  adminNote: {
    title: "Note",
    dataIndex: "adminNote",
    key: "adminNote",
  },
} satisfies ColumnBases;

const columns = objectValues(columnBases);

export const Admin = storeObserver(function Admin() {
  const { data: flags } = api.admin.flags.useQuery({ lastCount: 100 });

  if (flags === undefined) {
    return <LoadingCentered />;
  }

  return (
    <div>
      <Title>Admin</Title>
      <Table dataSource={flags} columns={columns} />
    </div>
  );
});
