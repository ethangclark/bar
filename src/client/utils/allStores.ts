import { ActivityStore } from "../activity/stores/activityStore";
import { DescendentStore } from "../activity/stores/descendentStore";
import { ActivityEditorStore } from "../activity/stores/activityEditorStore";
import { ItemStore } from "../activity/stores/itemStore";
import { QuestionStore } from "../activity/stores/questionStore";
import { ThreadStore } from "../activity/stores/threadStore";

const activityStore = new ActivityStore();
const descendentStore = new DescendentStore(activityStore);
const threadStore = new ThreadStore(descendentStore);
const activityEditorStore = new ActivityEditorStore(
  activityStore,
  descendentStore,
);
const itemStore = new ItemStore(activityEditorStore);
const questionStore = new QuestionStore(activityEditorStore);

export const stores = {
  activityStore,
  descendentStore,
  threadStore,
  activityEditorStore,
  itemStore,
  questionStore,
};

export type Stores = typeof stores;
