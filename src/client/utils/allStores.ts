import { trpc } from "~/trpc/proxy";
import { VideoUploadStore } from "../activity/Item/videoUploadStore";
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

const videoUploadStore = new VideoUploadStore();

const activitesStore = new QueryStore(trpc.activity.getAll.query);

const focusedActivityStore = new FocusedActivityStore();
const descendentStore = new DescendentStore(focusedActivityStore);
const threadStore = new ThreadStore(descendentStore);
const descendentDraftStore = new DescendentDraftStore(
  focusedActivityStore,
  descendentStore,
);
const activityEditorStore = new ActivityEditorStore(
  descendentStore,
  descendentDraftStore,
);
const questionStore = new QuestionStore(descendentDraftStore);
const itemStore = new ItemStore(descendentDraftStore, questionStore);
const studentModeStore = new StudentModeStore(focusedActivityStore);
const viewPieceStore = new ViewPieceStore(descendentStore);

export const stores = {
  activitesStore,
  focusedActivityStore,
  descendentStore,
  threadStore,
  descendentDraftStore,
  activityEditorStore,
  itemStore,
  questionStore,
  studentModeStore,
  viewPieceStore,
  videoUploadStore,
};

export function isStoreName(name: string): name is keyof typeof stores {
  return name in stores;
}

export type Stores = typeof stores;
