import { Dropdown } from "antd";
import { storeObserver } from "~/client/utils/storeObserver";

export const ViewsButton = storeObserver(function ViewsButton({
  editorStore,
  viewModeStore,
}) {
  return (
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
      View
    </Dropdown.Button>
  );
});
