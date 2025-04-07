import { Collapse, Table } from "antd";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { storeObserver } from "~/client/utils/storeObserver";
import { objectValues } from "~/common/objectUtils";
import { type UserBasic } from "~/common/types";
import { api } from "~/trpc/react";
import { LinkStyle } from "../components/Link";
import { LogoutButton } from "../components/LogoutButton";
import { Flags } from "./Flags";

type ColumnBases = Partial<{
  [Key in keyof UserBasic]: {
    title: string;
    dataIndex: Key;
    key: Key;
    render?: (value: UserBasic[Key], row: UserBasic) => React.ReactNode;
  };
}>;

export const Admin = storeObserver(function Admin({ userStore }) {
  const { data: users = [] } = api.admin.users.useQuery();
  const router = useRouter();

  const columns = useMemo(() => {
    const columnBases = {
      email: {
        title: "Email",
        dataIndex: "email",
        key: "email",
        render(_, row) {
          return (
            <LinkStyle
              onClick={() => {
                userStore.impersonateUser(row);
                router.push(`/overview`);
              }}
            >
              {row.email}
            </LinkStyle>
          );
        },
      },
      name: {
        title: "Name",
        dataIndex: "name",
        key: "name",
      },
      isInstructor: {
        title: "Instructor?",
        dataIndex: "isInstructor",
        key: "isInstructor",
        render: (_, row) => (row.isInstructor ? "Yes" : "No"),
      },
    } satisfies ColumnBases;

    const columns = objectValues(columnBases);

    return columns;
  }, [router, userStore]);

  const keyedUsers = useMemo(
    () => (users ?? []).map((f) => ({ ...f, key: f.id })),
    [users],
  );

  return (
    <div className="flex w-full flex-col">
      <div className="flex justify-end">
        <LogoutButton flushRight={false} />
      </div>
      <div className="mb-4 text-3xl font-bold">Admin</div>
      <Collapse
        items={[
          { key: "flags", label: "Flags", children: <Flags /> },
          {
            key: "users",
            label: "Users",
            children: <Table dataSource={keyedUsers} columns={columns} />,
          },
        ]}
      />
    </div>
  );
});
