import { ActivityStore } from "../activity/stores/activityStore";
import { DescendentStore } from "../activity/stores/descendentStore";
import { ActivityEditorStore } from "../activity/stores/activityEditorStore";
import { ItemStore } from "../activity/stores/itemStore";
import { ThreadStore } from "../activity/stores/threadStore";
import { QuestionStore } from "../activity/stores/questionStore";
import { StudentModeStore } from "../activity/stores/studentModeStore";

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

export const stores = {
  activityStore,
  descendentStore,
  threadStore,
  activityEditorStore,
  itemStore,
  questionStore,
  studentModeStore,
};

export type Stores = typeof stores;
