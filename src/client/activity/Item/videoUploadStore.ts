import { makeAutoObservable, observable } from "mobx";

export class VideoUploadStore {
  private uploadIds = observable.set<string>();

  constructor() {
    makeAutoObservable(this);
  }

  get isVideoUploading() {
    return this.uploadIds.size > 0;
  }

  noteVideoUploading() {
    const uploadId = crypto.randomUUID();
    this.uploadIds.add(uploadId);
    return { uploadId };
  }

  noteVideoUploadComplete({ uploadId }: { uploadId: string }) {
    this.uploadIds.delete(uploadId);
  }
}
