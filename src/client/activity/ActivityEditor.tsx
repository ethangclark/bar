import { LoadingCentered } from "~/client/components/Loading";
import { Status } from "~/client/utils/status";
import { storeObserver } from "~/client/utils/storeObserver";
import { IgodControls } from "./IgodControls";
import { Item } from "./Item";

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
    <div className="flex h-full w-full justify-center gap-4">
      <div className="h-full py-2">
        <IgodControls activityStatus={activity.status} />
      </div>
      <div className="mx-4 flex h-full w-[500px] flex-col justify-between pb-4 lg:w-[680px]">
        <div className="mb-4 w-full text-4xl">{activity.assignment.title}</div>
        <div
          className={`grid h-full auto-rows-min grid-cols-[repeat(1,_auto)] overflow-y-auto pb-40 pr-8`}
        >
          <div className="flex flex-col items-center"></div>
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
    </div>
  );
});
