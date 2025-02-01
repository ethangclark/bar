import { ActivityStore } from "../activity/activityStore";
import { ItemStore } from "../activity/itemStore";

const activityStore = new ActivityStore();
const itemStore = new ItemStore(activityStore);

export const stores = {
  activityStore,
  itemStore,
};

export type Stores = typeof stores;
