import { Input, Typography } from "antd";
import { generateKeyBetween } from "fractional-indexing";
import {
  FancySavingIndicator,
  LoadingCentered,
} from "~/client/components/Loading";
import { Status } from "~/client/utils/status";
import { storeObserver } from "~/client/utils/storeObserver";
import { indexToItemNumber } from "~/common/indexUtils";
import { LogoutButton } from "../components/LogoutButton";
import { AddItemButtons } from "./AddItemButtons";
import { EditorControls } from "./EditorControls";
import { Item } from "./Item/Item";
import { ScrollyContentBox } from "./ScrollyContentBox";

export const ActivityEditor = storeObserver(function ActivityEditor({
  focusedActivityStore,
  draftStore,
  itemStore,
  editorStore,
  uploadStore,
}) {
  const { data } = focusedActivityStore;
  const { sortedItems } = itemStore;

  if (data instanceof Status || sortedItems instanceof Status) {
    return <LoadingCentered />;
  }

  const { activity, enrolledAs, title, isTitleEditable } = data;

  const { titleSaving } = focusedActivityStore;

  return (
    <div className="mx-4 flex h-full w-[672px] flex-col justify-between pb-2">
      <div className="flex w-full items-center justify-between">
        <Typography.Link href="/overview">← Return to overview</Typography.Link>
        <LogoutButton />
      </div>
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
          <FancySavingIndicator
            saving={
              titleSaving ||
              editorStore.isSaving ||
              uploadStore.isSomethingUploading
            }
          />
        </div>
        <EditorControls activity={activity} />
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
              itemNumber={indexToItemNumber(idx)}
              deleted={draftStore.isDeletedDraft(item.id)}
              enrolledAs={enrolledAs}
              moveItemUp={
                idx > 0
                  ? () => {
                      const targetFracIdx = generateKeyBetween(
                        sortedItems[idx - 2]?.orderFracIdx ?? null,
                        sortedItems[idx - 1]?.orderFracIdx ?? null,
                      );
                      draftStore.updateDraft("items", {
                        id: item.id,
                        orderFracIdx: targetFracIdx,
                      });
                    }
                  : null
              }
              moveItemDown={
                idx < sortedItems.length - 1
                  ? () => {
                      const targetFracIdx = generateKeyBetween(
                        sortedItems[idx + 1]?.orderFracIdx ?? null,
                        sortedItems[idx + 2]?.orderFracIdx ?? null,
                      );
                      draftStore.updateDraft("items", {
                        id: item.id,
                        orderFracIdx: targetFracIdx,
                      });
                    }
                  : null
              }
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
