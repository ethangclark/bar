import { Badge, Dropdown } from "antd";
import { storeObserver } from "~/client/utils/storeObserver";

export const ViewsButton = storeObserver(function ViewsButton({
  editorStore,
  viewModeStore,
  submissionStore,
}) {
  const submittedUsers = submissionStore.submittedUsers({
    statusMeansZero: true,
  });

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
            {
              key: "submissions",
              label: "Submissions",
              onClick: () => viewModeStore.setViewMode("submissions"),
            },
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
