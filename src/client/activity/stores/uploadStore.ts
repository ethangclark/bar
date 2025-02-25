import { makeAutoObservable, observable } from "mobx";

export class UploadStore {
  private uploadIds = observable.set<string>();

  constructor() {
    makeAutoObservable(this);
  }

  get isSomethingUploading() {
    return this.uploadIds.size > 0;
  }

  noteUploadStarted() {
    const uploadId = crypto.randomUUID();
    this.uploadIds.add(uploadId);
    return { uploadId };
  }

  noteUploadComplete({ uploadId }: { uploadId: string }) {
    this.uploadIds.delete(uploadId);
  }
}
