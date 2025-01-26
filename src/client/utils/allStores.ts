import { ActivityEditorStore } from "../activity/activityEditorStore";
import { EvalKeyStore } from "../activity/evalKeyStore";

const activityEditorStore = new ActivityEditorStore();
const evalKeyStore = new EvalKeyStore(activityEditorStore);

export const stores = {
  activityEditorStore,
  evalKeyStore,
};

export type Stores = typeof stores;
