import { identity } from "@trpc/server/unstable-core-do-not-import";
import { makeAutoObservable } from "mobx";
import { clone } from "~/common/utils/cloneUtils";
import { indexById } from "~/common/utils/indexUtils";
import { type EvalKey } from "~/server/db/schema";
import { trpc } from "~/trpc/proxy";

export class EvalKeyStore {
  private draftEvalKeys = identity<Record<string, EvalKey>>({});

  private createdIds = new Set<string>();
  private modifiedIds = new Set<string>();
  private deletedIds = new Set<string>();

  private saving = false;

  constructor() {
    makeAutoObservable(this);
  }

  reset() {
    this.draftEvalKeys = {};
    this.createdIds.clear();
    this.modifiedIds.clear();
    this.deletedIds.clear();
  }

  loadEvalKeys(evalKeys: EvalKey[]) {
    this.draftEvalKeys = indexById(clone(evalKeys));
  }

  get canSave() {
    return !this.saving;
  }

  async save(activityId: string) {
    if (!this.canSave) return;
    this.saving = true;
    await trpc.evalKeys.modify.mutate({
      activityId,
      toCreate: [...this.createdIds]
        .map((id) => this.draftEvalKeys[id])
        .filter((ek) => ek?.activityId === activityId)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .map((ek) => ek!),
      toUpdate: [...this.modifiedIds]
        .map((id) => this.draftEvalKeys[id])
        .filter((ek) => ek?.activityId === activityId)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .map((ek) => ek!),
      toDelete: [...this.deletedIds]
        .map((id) => this.draftEvalKeys[id])
        .filter((ek) => ek?.activityId === activityId)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .map((ek) => ek!),
    });
  }
}
