import { trpc } from "~/trpc/proxy";
import {
  type DescendentServerInterface,
  DescendentStore,
} from "../activity/stores/descendentStore";
import { DraftStore } from "../activity/stores/draftStore";
import { EditorStore } from "../activity/stores/editorStore";
import { FocusedActivityStore } from "../activity/stores/focusedActivityStore";
import { ItemStore } from "../activity/stores/itemStore";
import { QuestionStore } from "../activity/stores/questionStore";
import { SubmissionStore } from "../activity/stores/submissionStore";
import { ThreadStore } from "../activity/stores/threadStore";
import { UploadStore } from "../activity/stores/uploadStore";
import { ViewModeStore } from "../activity/stores/viewModeStore";
import { ViewPieceStore } from "../activity/stores/viewPieceStore";
import { QueryStore } from "./queryStore";

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
const focusedActivityStore = new FocusedActivityStore();
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
const viewModeStore = new ViewModeStore(focusedActivityStore);
const viewPieceStore = new ViewPieceStore(descendentStore);
const submissionStore = new SubmissionStore(
  focusedActivityStore,
  trpc.submission.allCompletions.query,
);

export const stores = {
  activitesStore,
  editorStore,
  draftStore,
  descendentStore,
  focusedActivityStore,
  itemStore,
  questionStore,
  viewModeStore,
  threadStore,
  uploadStore,
  viewPieceStore,
  submissionStore,
};

export function isStoreName(name: string): name is keyof typeof stores {
  return name in stores;
}

export type Stores = typeof stores;
