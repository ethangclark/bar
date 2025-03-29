import { Checkbox, Table } from "antd";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { storeObserver } from "~/client/utils/storeObserver";
import { objectValues } from "~/common/objectUtils";
import { searchParamsX, type ViewMode } from "~/common/searchParams";
import { api } from "~/trpc/react";
import { LinkStyle } from "../components/Link";
import { LoadingCentered } from "../components/Loading";
import { LogoutButton } from "../components/LogoutButton";
import { Title } from "../components/Title";

export const Admin = storeObserver(function Admin({ userStore }) {
  const { data: flags, refetch } = api.admin.flags.useQuery({ lastCount: 100 });
  const { mutateAsync: toggleFlag } = api.admin.toggleFlag.useMutation();

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

  const [flagChanging, setFlagChanging] = useState(false);

  const columns = useMemo(() => {
    const columnBases = {
      adminChecked: {
        title: "Checked",
        dataIndex: "adminChecked",
        key: "adminChecked",
        render: (adminChecked: boolean, row: FlagWithUser) => {
          if (flagChanging) {
            return <LoadingCentered />;
          }
          return (
            <Checkbox
              checked={row.adminChecked}
              onChange={async () => {
                setFlagChanging(true);
                await toggleFlag({ id: row.id });
                await refetch();
                setFlagChanging(false);
              }}
            />
          );
        },
      },
      createdAt: {
        title: "Created At",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (createdAt: Date) => createdAt.toLocaleString(),
      },
      userId: {
        title: "User ID",
        dataIndex: "userId",
        key: "userId",
      },
      activityId: {
        title: "Activity ID",
        dataIndex: "activityId",
        key: "activityId",
        render: (activityId: string, row: FlagWithUser) => (
          <LinkStyle
            onClick={() => {
              userStore.impersonateUser(row.user);
              router.push(
                `/activity/${row.activityId}?${searchParamsX.activityViewMode.key}=${"doer" satisfies ViewMode}&${searchParamsX.threadId.key}=${row.threadId}&${searchParamsX.messageId.key}=${row.messageId}`,
              );
            }}
          >
            {activityId}
          </LinkStyle>
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
  }, [flagChanging, refetch, router, toggleFlag, userStore]);

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
        <LogoutButton flushRight={false} />
      </div>
      <Title>Admin</Title>
      <Table dataSource={keyedFlags} columns={columns} />
    </div>
  );
});
