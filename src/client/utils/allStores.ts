import { trpc } from "~/trpc/proxy";
import { UploadStore } from "../activity/Item/uploadStore";
import { ActivityEditorStore } from "../activity/stores/activityEditorStore";
import { DescendentDraftStore } from "../activity/stores/descendentDraftStore";
import { DescendentStore } from "../activity/stores/descendentStore";
import { FocusedActivityStore } from "../activity/stores/focusedActivityStore";
import { ItemStore } from "../activity/stores/itemStore";
import { QuestionStore } from "../activity/stores/questionStore";
import { StudentModeStore } from "../activity/stores/studentModeStore";
import { ThreadStore } from "../activity/stores/threadStore";
import { ViewPieceStore } from "../activity/stores/viewPieceStore";
import { QueryStore } from "./queryStore";

const activitesStore = new QueryStore(trpc.activity.getAll.query);
const uploadStore = new UploadStore();
const focusedActivityStore = new FocusedActivityStore();
const descendentStore = new DescendentStore(focusedActivityStore);
const threadStore = new ThreadStore(descendentStore);
const descendentDraftStore = new DescendentDraftStore(
  focusedActivityStore,
  descendentStore,
);
const activityEditorStore = new ActivityEditorStore(
  descendentDraftStore,
  uploadStore,
);
const questionStore = new QuestionStore(descendentDraftStore);
const itemStore = new ItemStore(descendentDraftStore, questionStore);
const studentModeStore = new StudentModeStore(focusedActivityStore);
const viewPieceStore = new ViewPieceStore(descendentStore);

export const stores = {
  activitesStore,
  activityEditorStore,
  descendentDraftStore,
  descendentStore,
  focusedActivityStore,
  itemStore,
  questionStore,
  studentModeStore,
  threadStore,
  uploadStore,
  viewPieceStore,
};

export function isStoreName(name: string): name is keyof typeof stores {
  return name in stores;
}

export type Stores = typeof stores;
