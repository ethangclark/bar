import { autorun, makeAutoObservable } from "mobx";
import { QueryStore } from "~/client/utils/queryStore";
import { Status } from "~/client/utils/status";
import { type UserBasic } from "~/common/types";
import { type Completion, type Flag } from "~/server/db/schema";
import { type FocusedActivityStore } from "./focusedActivityStore";

type CompletionGetter = (params: { activityId: string }) => Promise<
  Array<{
    user: UserBasic;
    completions: Completion[];
    flags: Flag[];
  }>
>;

export class SubmissionStore {
  private completionsQueryStore: QueryStore<CompletionGetter>;

  constructor(
    private focusedActivityStore: FocusedActivityStore,
    getAllCompletions: CompletionGetter,
  ) {
    makeAutoObservable(this);
    this.completionsQueryStore = new QueryStore(getAllCompletions);
    autorun(() => {
      const { activityId } = this.focusedActivityStore;
      if (activityId !== undefined) {
        void this.completionsQueryStore.fetch({ activityId });
      }
    });
  }

  get submissions() {
    const { data } = this.completionsQueryStore;
    if (data instanceof Status) {
      return data;
    }
    return data;
  }

  submittedUsers(_: { statusMeansZero: true }) {
    const { data } = this.completionsQueryStore;
    if (data instanceof Status) {
      return 0;
    }
    return data.length;
  }
}
