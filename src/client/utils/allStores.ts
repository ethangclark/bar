import { ActivityStore } from "../activity/activityStore";
import { ItemStore } from "../activity/itemStore";
import { QuestionStore } from "../activity/questionStore";

const activityStore = new ActivityStore();
const itemStore = new ItemStore(activityStore);
const questionStore = new QuestionStore(activityStore);

export const stores = {
  activityStore,
  itemStore,
  questionStore,
};

export type Stores = typeof stores;
