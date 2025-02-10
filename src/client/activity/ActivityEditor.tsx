import { LoadingCentered } from "~/client/components/Loading";
import { storeObserver } from "~/client/utils/storeObserver";
import { Status } from "~/client/utils/status";
import { Item } from "./Item";
import { IgodControls } from "./IgodControls";

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
    <div className="flex h-full w-full justify-center pt-12">
      <IgodControls activityStatus={activity.status} />
      <div
        className={`grid h-full auto-rows-min grid-cols-[repeat(1,_auto)] overflow-y-auto pr-4`}
      >
        <div className="flex flex-col items-center">
          <div className="mb-4 text-4xl">{activity.assignment.title}</div>
        </div>
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
      </div>
    </div>
  );
});
