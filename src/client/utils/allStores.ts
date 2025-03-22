import { trpc } from "~/trpc/proxy";
import {
  type DescendentServerInterface,
  DescendentStore,
} from "../activity/stores/descendentStore";
import { DraftStore } from "../activity/stores/draftStore";
import { EditorStore } from "../activity/stores/editorStore";
import { FocusedActivityStore } from "../activity/stores/focusedActivityStore";
import { HmrStore } from "../activity/stores/hmrStore";
import { ItemStore } from "../activity/stores/itemStore";
import { LocationStore } from "../activity/stores/locationStore";
import { QuestionStore } from "../activity/stores/questionStore";
import { SubmissionStore } from "../activity/stores/submissionStore";
import { ThreadStore } from "../activity/stores/threadStore";
import { UploadStore } from "../activity/stores/uploadStore";
import { UserStore } from "../activity/stores/userStore";
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

const hmrStore = new HmrStore();
const activitesStore = new QueryStore(trpc.activity.getAll.query);
const uploadStore = new UploadStore();
const focusedActivityStore = new FocusedActivityStore();
const locationStore = new LocationStore();
const viewModeStore = new ViewModeStore(focusedActivityStore, locationStore);
const userStore = new UserStore(locationStore, viewModeStore);
const descendentStore = new DescendentStore(
  descendentServerInterface,
  focusedActivityStore,
  userStore,
  hmrStore,
);
const threadStore = new ThreadStore(
  descendentStore,
  focusedActivityStore,
  userStore,
);
const draftStore = new DraftStore(focusedActivityStore, descendentStore);
const editorStore = new EditorStore(
  draftStore,
  uploadStore,
  focusedActivityStore,
);
const questionStore = new QuestionStore(draftStore);
const itemStore = new ItemStore(draftStore, questionStore);
const viewPieceStore = new ViewPieceStore(descendentStore);
const submissionStore = new SubmissionStore(
  focusedActivityStore,
  trpc.submission.enrolleeCompletions.query,
);

export const stores = {
  activitesStore,
  editorStore,
  draftStore,
  descendentStore,
  focusedActivityStore,
  hmrStore,
  itemStore,
  locationStore,
  questionStore,
  submissionStore,
  threadStore,
  uploadStore,
  userStore,
  viewModeStore,
  viewPieceStore,
};

export function isStoreName(name: string): name is keyof typeof stores {
  return name in stores;
}

export type Stores = typeof stores;
