import { ActivityEditorStore } from "../activity/activityEditorStore";

const activityEditorStore = new ActivityEditorStore();

export const stores = {
  activityEditorStore,
};

export type Stores = typeof stores;
