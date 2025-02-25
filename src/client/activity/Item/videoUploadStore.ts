import { message } from "antd";
import { makeAutoObservable, observable, runInAction } from "mobx";
import { type InfoVideoIdParam } from "~/app/api/video/upload/route";
import { NotLoaded, Status } from "~/client/utils/status";
import { noop } from "~/common/fnUtils";
import { type DescendentDraftStore } from "../stores/descendentDraftStore";
import { type DescendentStore } from "../stores/descendentStore";

export class VideoUploadStore {
  // pending === pending upload
  private infoVideoIdToPendingVideo = observable.map<string, File>();
  private erroredInfoVideoIdsToMessage = observable.map<string, string>();
  private infoVideoIdsUploading = observable.set<string>();
  reset() {
    this.infoVideoIdToPendingVideo.clear();
    this.erroredInfoVideoIdsToMessage.clear();
    this.infoVideoIdsUploading.clear();
  }

  constructor(
    private descendentStore: DescendentStore,
    private descendentDraftStore: DescendentDraftStore,
  ) {
    makeAutoObservable(this);
  }

  errorMessage({ infoVideoId }: { infoVideoId: string }) {
    return this.erroredInfoVideoIdsToMessage.get(infoVideoId) ?? null;
  }

  fileStatus({ infoVideoId }: { infoVideoId: string }) {
    if (this.infoVideoIdsUploading.has(infoVideoId)) {
      return "uploading";
    }
    if (this.erroredInfoVideoIdsToMessage.has(infoVideoId)) {
      return "errored";
    }
    if (this.infoVideoIdToPendingVideo.has(infoVideoId)) {
      return "pending";
    }
    const saved = this.descendentStore.getById("infoVideos", infoVideoId);
    if (saved && !(saved instanceof Status)) {
      return "saved";
    }
    return "not selected";
  }

  private get someFileIsNotSelected() {
    const drafts = this.descendentDraftStore.getDrafts("infoVideos");
    if (drafts instanceof Status) {
      return false;
    }
    return drafts.some((draft) => {
      const saved = this.descendentStore.getById("infoVideos", draft.id);
      const noSavedFile = saved === undefined || saved instanceof NotLoaded;
      const noPendingFile =
        this.infoVideoIdToPendingVideo.get(draft.id) === undefined;
      return noSavedFile && noPendingFile;
    });
  }
  private get areVideosUploading() {
    return this.infoVideoIdsUploading.size > 0;
  }
  private get isSomeVideoPending() {
    return this.infoVideoIdToPendingVideo.size > 0;
  }
  private get isAwaitingLoadOrSelection() {
    return this.someFileIsNotSelected || this.areVideosUploading;
  }

  get areAllVideosPersisted() {
    return !this.isSomeVideoPending && !this.isAwaitingLoadOrSelection;
  }
  get readyForAJuicySave() {
    return this.isSomeVideoPending && !this.isAwaitingLoadOrSelection;
  }

  isOkToSave({ infoVideoId }: { infoVideoId: string }) {
    const fileStatus = this.fileStatus({ infoVideoId });
    return ["pending", "saved"].includes(fileStatus);
  }

  storePendingVideo(infoVideoId: string, file: File) {
    this.infoVideoIdToPendingVideo.set(infoVideoId, file);
  }

  async saveVideos() {
    await Promise.all(
      Array.from(this.infoVideoIdToPendingVideo.entries()).map(
        async ([infoVideoId, file]) => {
          this.infoVideoIdsUploading.add(infoVideoId);
          const formData = new FormData();
          formData.append("video", file);
          try {
            const res = await fetch(
              `/api/video/upload?${
                "infoVideoId" satisfies InfoVideoIdParam
              }=${infoVideoId}`,
              {
                method: "POST",
                body: formData,
              },
            );

            // Nothing to actually do with this lol.
            // Just keeping so the control flow is consistent and errors flow as expected
            noop(await res.json());

            runInAction(() => {
              this.infoVideoIdToPendingVideo.delete(infoVideoId);
              this.erroredInfoVideoIdsToMessage.delete(infoVideoId);
            });
          } catch (error) {
            // Could get fancy and include the item number in the error message
            // TODO: show descriptive error state on the failed video items
            void message.error("Video upload failed.");
            runInAction(() => {
              this.erroredInfoVideoIdsToMessage.set(
                infoVideoId,
                error instanceof Error ? error.message : "Unknown error",
              );
            });
          } finally {
            runInAction(() => {
              this.infoVideoIdsUploading.delete(infoVideoId);
            });
          }
        },
      ),
    );
  }
}
