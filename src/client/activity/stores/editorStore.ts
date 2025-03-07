import { makeAutoObservable, runInAction } from "mobx";
import { Status } from "~/client/utils/status";
import {
  type DescendentName,
  type DescendentRows,
} from "~/common/descendentUtils";
import {
  isEvalKeyDraftReady,
  isInfoImageDraftReady,
  isInfoTextDraftReady,
  isInfoVideoDraftReady,
  isQuestionDraftReady,
} from "../Item/itemValidator";
import { type DraftStore } from "./draftStore";
import { type FocusedActivityStore } from "./focusedActivityStore";
import { type UploadStore } from "./uploadStore";

export class EditorStore {
  private savingChanges = false;

  constructor(
    private draftStore: DraftStore,
    private uploadStore: UploadStore,
    private focusedActivityStore: FocusedActivityStore,
  ) {
    makeAutoObservable(this);
  }

  itemDraftStatus<T extends DescendentName>(
    descendentName: T,
    isReady: (item: DescendentRows[T]) => boolean,
  ) {
    const drafts = this.draftStore.getDrafts(descendentName);
    if (drafts instanceof Status) {
      return { isLoading: true, hasProblem: false, includesSaveable: false };
    }
    return {
      isLoading: false,
      hasProblem: !drafts.every(isReady),
      includesSaveable: drafts.some((i) => this.draftStore.isEditedDraft(i.id)),
    };
  }

  get draftStatus() {
    const items = this.draftStore.getDrafts("items");
    const itemsStatus = {
      isLoading: items instanceof Status,
      hasProblem: false,
      includesSaveable:
        items instanceof Status
          ? false
          : items.some((i) => this.draftStore.isEditedDraft(i.id)),
    };

    const statuses = [
      itemsStatus,
      this.itemDraftStatus("questions", isQuestionDraftReady),
      this.itemDraftStatus("evalKeys", isEvalKeyDraftReady),
      this.itemDraftStatus("infoImages", isInfoImageDraftReady),
      this.itemDraftStatus("infoTexts", isInfoTextDraftReady),
      this.itemDraftStatus("infoVideos", (iv) => isInfoVideoDraftReady(iv)),
    ];

    const isLoading = statuses.some((s) => s.isLoading);
    const hasProblem = statuses.some((s) => s.hasProblem);
    const includesSaveable = statuses.some((s) => s.includesSaveable);

    return { isLoading, hasProblem, includesSaveable };
  }

  get canSave() {
    const draftStatus = this.draftStatus;
    if (draftStatus.isLoading) {
      return false;
    }
    if (draftStatus.hasProblem) {
      return false;
    }
    if (this.uploadStore.isSomethingUploading) {
      return false;
    }
    return draftStatus.includesSaveable;
  }
  get canDemo() {
    const draftStatus = this.draftStatus;
    if (draftStatus.isLoading) {
      return false;
    }
    if (draftStatus.hasProblem) {
      return false;
    }
    if (this.uploadStore.isSomethingUploading) {
      return false;
    }
    return !draftStatus.includesSaveable;
  }
  get canPublish() {
    if (this.focusedActivityStore.activity instanceof Status) {
      return false;
    }
    return (
      this.canDemo && this.focusedActivityStore.activity.status === "draft"
    );
  }

  async save() {
    this.savingChanges = true;
    await this.draftStore.saveChanges();
    runInAction(() => {
      this.savingChanges = false;
    });
  }

  get isSaving() {
    return this.savingChanges;
  }
}
