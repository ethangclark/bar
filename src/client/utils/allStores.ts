import { ActivityStore } from "../activity/activityStore";
import { EvalKeyStore } from "../activity/evalKeyStore";
import { ActivityEditorStore } from "../activity/activityEditorStore";

const activityStore = new ActivityStore();
const evalKeyStore = new EvalKeyStore();
const activityEditorStore = new ActivityEditorStore(
  activityStore,
  evalKeyStore,
);

export const stores = {
  activityStore,
  evalKeyStore,
  activityEditorStore,
};

export type Stores = typeof stores;
