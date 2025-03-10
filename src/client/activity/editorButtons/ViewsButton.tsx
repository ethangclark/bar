import { Badge, Dropdown } from "antd";
import { Status } from "~/client/utils/status";
import { storeObserver } from "~/client/utils/storeObserver";

export const ViewsButton = storeObserver(function ViewsButton({
  editorStore,
  viewModeStore,
  submissionStore,
  focusedActivityStore,
}) {
  const submittedUsers = submissionStore.submittedUsers({
    statusMeansZero: true,
  });

  const isPublished =
    !(focusedActivityStore.activity instanceof Status) &&
    focusedActivityStore.activity.status === "published";

  return (
    <Badge count={submittedUsers} showZero={false}>
      <Dropdown.Button
        menu={{
          items: [
            {
              key: "student-view",
              label: "Student view",
              onClick: () => viewModeStore.setViewMode("doer"),
              disabled: !editorStore.canDemo,
            },
            ...(submittedUsers > 0 || isPublished
              ? [
                  {
                    key: "submissions",
                    label: `Submissions (${submittedUsers})`,
                    onClick: () => viewModeStore.setViewMode("submissions"),
                  },
                ]
              : []),
          ],
        }}
      >
        <span className="flex items-center gap-x-1">
          <span>View</span>
        </span>
      </Dropdown.Button>
    </Badge>
  );
});
