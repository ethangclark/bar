import { message } from "antd";
import { makeAutoObservable, observable } from "mobx";
import {
  InfoVideoIdParam,
  VideoUploadResponse,
} from "~/app/api/video/upload/route";
import { noop } from "~/common/fnUtils";
import { objectEntries } from "~/common/objectUtils";

export class VideoUploadStore {
  private infoVideoIdToUnsavedVideo: Record<string, File> = {};
  private erroredInfoVideoIds = observable.set<string>();
  private infoVideoIdsUploading = observable.set<string>();
  reset() {
    this.infoVideoIdToUnsavedVideo = {};
    this.erroredInfoVideoIds.clear();
    this.infoVideoIdsUploading.clear();
  }

  constructor() {
    makeAutoObservable(this);
  }

  addNonUploadedVideoFile(infoVideoId: string, file: File) {
    this.infoVideoIdToUnsavedVideo[infoVideoId] = file;
  }

  storeUnsavedVideo(infoVideoId: string, videoFile: File) {
    this.infoVideoIdToUnsavedVideo[infoVideoId] = videoFile;
  }

  async saveVideos() {
    await Promise.all(
      objectEntries(this.infoVideoIdToUnsavedVideo).map(
        async ([infoVideoId, videoFile]) => {
          const formData = new FormData();
          formData.append("video", videoFile);
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
            const data: VideoUploadResponse = await res.json();

            // Nothing to actually do with this lol.
            // Just keeping so the control flow is consistent and errors flow as expected
            noop(data);

            delete this.infoVideoIdToUnsavedVideo[infoVideoId];
            this.erroredInfoVideoIds.delete(infoVideoId);
          } catch (error) {
            // Could get fancy and include the item number in the error message
            // TODO: show descriptive error state on the failed video items
            message.error("Video upload failed.");
            this.erroredInfoVideoIds.add(infoVideoId);
          }
        },
      ),
    );
  }
}
