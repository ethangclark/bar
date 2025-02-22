import { Input, Typography } from "antd";
import classnames from "classnames";
import { CheckCircle } from "lucide-react";
import {
  LoadingCentered,
  LoadingNotCentered,
} from "~/client/components/Loading";
import { Status } from "~/client/utils/status";
import { storeObserver } from "~/client/utils/storeObserver";
import { AddItemButtons } from "./AddItemButtons";
import { EditorControls } from "./EditorControls";
import { Item } from "./Item/Item";
import { ScrollyContentBox } from "./ScrollyContentBox";

export const ActivityEditor = storeObserver(function ActivityEditor({
  focusedActivityStore,
  activityDraftStore,
  itemStore,
}) {
  const { data } = focusedActivityStore;
  const { sortedItems } = itemStore;

  if (data instanceof Status || sortedItems instanceof Status) {
    return <LoadingCentered />;
  }

  const { activity, enrolledAs, title, isTitleEditable } = data;

  const { titleSaving, titleSaved } = focusedActivityStore;

  return (
    <div className="mx-4 flex h-full w-[672px] flex-col justify-between pb-2">
      <Typography.Link href="/overview">← All activities</Typography.Link>
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="mr-2 flex grow items-center gap-4">
          <Input
            className="w-full grow border-none text-2xl"
            value={title}
            onChange={(e) => {
              if (isTitleEditable) {
                void focusedActivityStore.updateTitle(e.target.value);
              }
            }}
          />
          <div className="relative">
            <div className={titleSaving ? "visible" : "invisible"}>
              <LoadingNotCentered />
            </div>
            <div
              className={classnames(
                "absolute inset-0 mt-1 flex items-center justify-center transition-opacity",
                {
                  "opacity-100 duration-[0ms]": titleSaved,
                  "opacity-0 duration-[2000ms]": !titleSaved,
                  invisible: titleSaving,
                  visible: !titleSaving,
                },
              )}
            >
              <CheckCircle size={16} />
            </div>
          </div>
        </div>
        <EditorControls activityStatus={activity.status} />
      </div>
      <ScrollyContentBox className="mb-5 p-6 pb-24">
        {sortedItems.length === 0 && (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-gray-500">
              No items yet. Add one to get started.
            </div>
          </div>
        )}
        {sortedItems.map((item, idx) => {
          return (
            <Item
              key={item.id}
              item={itemStore.getItemWithChildren(item)}
              itemNumber={idx + 1}
              deleted={activityDraftStore.isDeletedDraft(item.id)}
              enrolledAs={enrolledAs}
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
