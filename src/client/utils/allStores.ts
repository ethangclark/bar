import { trpc } from "~/trpc/proxy";
import { VideoUploadStore } from "../activity/Item/videoUploadStore";
import { ActivityDraftStore } from "../activity/stores/activityDraftStore";
import { ActivityEditorStore } from "../activity/stores/activityEditorStore";
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
const activityDraftStore = new ActivityDraftStore(
  focusedActivityStore,
  descendentStore,
);
const activityEditorStore = new ActivityEditorStore(
  descendentStore,
  activityDraftStore,
);
const questionStore = new QuestionStore(activityDraftStore);
const itemStore = new ItemStore(activityDraftStore, questionStore);
const studentModeStore = new StudentModeStore(focusedActivityStore);
const viewPieceStore = new ViewPieceStore(descendentStore);

export const stores = {
  activitesStore,
  focusedActivityStore,
  descendentStore,
  threadStore,
  activityDraftStore,
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
