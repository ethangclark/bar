import { Table, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { storeObserver } from "~/client/utils/storeObserver";
import { objectValues } from "~/common/objectUtils";
import { api } from "~/trpc/react";
import { LoadingCentered } from "../components/Loading";
import { LogoutButton } from "../components/LogoutButton";
import { Title } from "../components/Title";

export const Admin = storeObserver(function Admin({
  userStore,
  viewModeStore,
}) {
  const { data: flags } = api.admin.flags.useQuery({ lastCount: 100 });

  type FlagWithUser = typeof flags extends undefined | Array<infer T>
    ? T
    : never;

  type ColumnBases = Partial<{
    [Key in keyof FlagWithUser]: {
      title: string;
      dataIndex: Key;
      key: Key;
      render?: (value: FlagWithUser[Key], row: FlagWithUser) => React.ReactNode;
    };
  }>;

  const router = useRouter();

  const columns = useMemo(() => {
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
        render: (activityId: string, row: FlagWithUser) => (
          <Typography.Link
            onClick={() => {
              userStore.impersonateUser(row.user);
              router.push(`/activity/${row.activityId}`);
              viewModeStore.setViewMode("doer");
            }}
          >
            {activityId}
          </Typography.Link>
        ),
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

    return columns;
  }, [router, userStore, viewModeStore]);

  const keyedFlags = useMemo(
    () => (flags ?? []).map((f) => ({ ...f, key: f.id })),
    [flags],
  );

  if (flags === undefined) {
    return <LoadingCentered />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <LogoutButton normalPadding />
      </div>
      <Title>Admin</Title>
      <Table dataSource={keyedFlags} columns={columns} />
    </div>
  );
});
