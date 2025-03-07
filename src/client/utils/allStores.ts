import { trpc } from "~/trpc/proxy";
import {
  type DescendentServerInterface,
  DescendentStore,
} from "../activity/stores/descendentStore";
import { DraftStore } from "../activity/stores/draftStore";
import { EditorStore } from "../activity/stores/editorStore";
import {
  type ActivityServerInterface,
  FocusedActivityStore,
} from "../activity/stores/focusedActivityStore";
import { ItemStore } from "../activity/stores/itemStore";
import { QuestionStore } from "../activity/stores/questionStore";
import { StudentModeStore } from "../activity/stores/studentModeStore";
import { ThreadStore } from "../activity/stores/threadStore";
import { UploadStore } from "../activity/stores/uploadStore";
import { ViewPieceStore } from "../activity/stores/viewPieceStore";
import { QueryStore } from "./queryStore";

const activityServerInterface: ActivityServerInterface = {
  getActivity: trpc.activity.get.query,
  updateActivityTitle: trpc.activity.updateAdHocActivity.mutate,
  updateActivityStatus: trpc.activity.updateStatus.mutate,
};

const descendentServerInterface: DescendentServerInterface = {
  readDescendents: trpc.descendent.read.query,
  subscribeToNewDescendents: (params, onData) =>
    trpc.descendent.newDescendents.subscribe(params, { onData }),
  subscribeToMessageDeltas: (params, onMessageDelta) =>
    trpc.message.messageDeltas.subscribe(params, {
      onData: onMessageDelta,
    }),
  modifyDescendents: trpc.descendent.modify.mutate,
};

const activitesStore = new QueryStore(trpc.activity.getAll.query);
const uploadStore = new UploadStore();
const focusedActivityStore = new FocusedActivityStore(activityServerInterface);
const descendentStore = new DescendentStore(
  descendentServerInterface,
  focusedActivityStore,
);
const threadStore = new ThreadStore(descendentStore, focusedActivityStore);
const draftStore = new DraftStore(focusedActivityStore, descendentStore);
const editorStore = new EditorStore(
  draftStore,
  uploadStore,
  focusedActivityStore,
);
const questionStore = new QuestionStore(draftStore);
const itemStore = new ItemStore(draftStore, questionStore);
const studentModeStore = new StudentModeStore(focusedActivityStore);
const viewPieceStore = new ViewPieceStore(descendentStore);

export const stores = {
  activitesStore,
  editorStore,
  draftStore,
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
