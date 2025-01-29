import { makeAutoObservable } from "mobx";
import { Status } from "~/common/utils/status";
import { trpc } from "~/trpc/proxy";
import { type ActivityStore } from "./activityStore";
import { type EvalKeyStore } from "./evalKeyStore";

export class ActivityEditorStore {
  constructor(
    private activityStore: ActivityStore,
    private evalKeyStore: EvalKeyStore,
  ) {
    makeAutoObservable(this);
  }

  async loadActivity(activityId: string) {
    const { activity, evalKeys } = await trpc.activity.editorData.query({
      activityId,
    });
    this.activityStore.loadActivity(activity);
    this.evalKeyStore.loadEvalKeys(evalKeys);
  }

  reset() {
    this.activityStore.reset();
    this.evalKeyStore.reset();
  }

  get canSave() {
    return this.activityStore.canSave && this.evalKeyStore.canSave;
  }

  async save() {
    if (!this.canSave) return;
    if (this.activityStore.savedActivity instanceof Status) return;
    const activityId = this.activityStore.savedActivity.id;
    await Promise.all([
      await this.activityStore.save(),
      await this.evalKeyStore.save(activityId),
    ]);
    this.activityStore.reset();
    this.evalKeyStore.reset();
    await this.loadActivity(activityId);
  }
}
