import { message } from "antd";
import { makeAutoObservable, observable, runInAction } from "mobx";
import { type InfoVideoIdParam } from "~/app/api/video/upload/route";
import { NotLoaded, Status } from "~/client/utils/status";
import { noop } from "~/common/fnUtils";
import { objectEntries } from "~/common/objectUtils";
import { type DescendentDraftStore } from "../stores/descendentDraftStore";
import { type DescendentStore } from "../stores/descendentStore";

export class VideoUploadStore {
  // pending === pending upload
  private infoVideoIdToPendingVideo: { [infoVideoId: string]: File } = {};
  private erroredInfoVideoIdsToMessage: { [infoVideoId: string]: string } = {};
  private infoVideoIdsUploading = observable.set<string>();
  reset() {
    this.infoVideoIdToPendingVideo = {};
    this.erroredInfoVideoIdsToMessage = {};
    this.infoVideoIdsUploading.clear();
  }

  constructor(
    private descendentStore: DescendentStore,
    private descendentDraftStore: DescendentDraftStore,
  ) {
    makeAutoObservable(this);
  }

  errorMessage({ infoVideoId }: { infoVideoId: string }) {
    return this.erroredInfoVideoIdsToMessage[infoVideoId] ?? null;
  }

  fileStatus({ infoVideoId }: { infoVideoId: string }) {
    if (this.infoVideoIdsUploading.has(infoVideoId)) {
      return "uploading";
    }
    if (this.erroredInfoVideoIdsToMessage[infoVideoId] !== undefined) {
      return "errored";
    }
    if (this.infoVideoIdToPendingVideo[infoVideoId] !== undefined) {
      return "pending";
    }
    const saved = this.descendentStore.getById("infoVideos", infoVideoId);
    if (saved && !(saved instanceof Status)) {
      return "saved";
    }
    return "not selected";
  }

  get someFileIsNotSelected() {
    const drafts = this.descendentDraftStore.getDrafts("infoVideos");
    if (drafts instanceof Status) {
      return false;
    }
    return drafts.some((draft) => {
      const saved = this.descendentStore.getById("infoVideos", draft.id);
      const noSavedFile = saved === undefined || saved instanceof NotLoaded;
      const noPendingFile =
        this.infoVideoIdToPendingVideo[draft.id] === undefined;
      return noSavedFile && noPendingFile;
    });
  }

  get areVideosUploading() {
    return this.infoVideoIdsUploading.size > 0;
  }
  get areVideosPending() {
    return Object.values(this.infoVideoIdToPendingVideo).length > 0;
  }

  get isEverythingPersisted() {
    return (
      !this.someFileIsNotSelected &&
      !this.areVideosUploading &&
      !this.areVideosPending
    );
  }
  get teedForAJuicySave() {
    return (
      this.areVideosPending &&
      !this.someFileIsNotSelected &&
      !this.areVideosUploading
    );
  }

  storePendingVideo(infoVideoId: string, file: File) {
    this.infoVideoIdToPendingVideo[infoVideoId] = file;
  }

  async saveVideos() {
    await Promise.all(
      objectEntries(this.infoVideoIdToPendingVideo).map(
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
              delete this.infoVideoIdToPendingVideo[infoVideoId];
              delete this.erroredInfoVideoIdsToMessage[infoVideoId];
            });
          } catch (error) {
            // Could get fancy and include the item number in the error message
            // TODO: show descriptive error state on the failed video items
            void message.error("Video upload failed.");
            runInAction(() => {
              this.erroredInfoVideoIdsToMessage[infoVideoId] =
                error instanceof Error ? error.message : "Unknown error";
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
