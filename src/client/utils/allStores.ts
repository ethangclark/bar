import { ActivityEditorStore } from "../activity/stores/activityEditorStore";
import { ActivityStore } from "../activity/stores/activityStore";
import { DescendentStore } from "../activity/stores/descendentStore";
import { ItemStore } from "../activity/stores/itemStore";
import { QuestionStore } from "../activity/stores/questionStore";
import { StudentModeStore } from "../activity/stores/studentModeStore";
import { ThreadStore } from "../activity/stores/threadStore";
import { ViewPieceStore } from "../activity/stores/viewPieceStore";

const activityStore = new ActivityStore();
const descendentStore = new DescendentStore(activityStore);
const threadStore = new ThreadStore(descendentStore);
const activityEditorStore = new ActivityEditorStore(
  activityStore,
  descendentStore,
);
const itemStore = new ItemStore(activityEditorStore);
const questionStore = new QuestionStore(activityEditorStore);
const studentModeStore = new StudentModeStore(activityStore);
const viewPieceStore = new ViewPieceStore(descendentStore);

export const stores = {
  activityStore,
  descendentStore,
  threadStore,
  activityEditorStore,
  itemStore,
  questionStore,
  studentModeStore,
  viewPieceStore,
};

export function isStoreName(name: string): name is keyof typeof stores {
  return name in stores;
}

export type Stores = typeof stores;
