import { LoadingCentered } from "~/client/components/Loading";
import { Status } from "~/client/utils/status";
import { storeObserver } from "~/client/utils/storeObserver";
import { AddItemButtons } from "./AddItemButtons";
import { EditorControls } from "./EditorControls";
import { Item } from "./Item";
import { ScrollyContentBox } from "./ScrollyContentBox";

export const ActivityEditor = storeObserver(function ActivityEditor({
  activityStore,
  activityEditorStore,
  itemStore,
}) {
  const { activity } = activityStore;
  const { sortedItems } = itemStore;

  if (activity instanceof Status || sortedItems instanceof Status) {
    return <LoadingCentered />;
  }

  return (
    <div className="mx-4 flex h-full w-[672px] flex-col justify-between pb-2">
      <div className="mb-5 flex items-start justify-between gap-2">
        <div className="w-full text-3xl">{activity.assignment.title}</div>
        <EditorControls activityStatus={activity.status} />
      </div>
      <ScrollyContentBox className="mb-5 p-6 pb-24">
        {sortedItems.map((item, idx) => {
          const infoImage = itemStore.getInfoImage(item.id);
          const infoText = itemStore.getTextInfo(item.id);
          const question = itemStore.getQuestion(item.id);
          return (
            <Item
              key={item.id}
              item={item}
              itemNumber={idx + 1}
              deleted={activityEditorStore.isDeletedDraft(item.id)}
              enrolledAs={activity.course.enrolledAs}
              infoImage={infoImage}
              infoText={infoText}
              question={question}
            />
          );
        })}
      </ScrollyContentBox>
      <div className="flex justify-center">
        <AddItemButtons />
      </div>
    </div>
  );
});
