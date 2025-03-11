import { autorun, makeAutoObservable } from "mobx";
import { QueryStore } from "~/client/utils/queryStore";
import { Status } from "~/client/utils/status";
import { groupBy } from "~/common/indexUtils";
import { type Completion } from "~/server/db/schema";
import { type FocusedActivityStore } from "./focusedActivityStore";

type CompletionGetter = (params: { activityId: string }) => Promise<
  Array<
    Completion & {
      user: { id: string; name: string | null; email: string | null };
    }
  >
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
    const byUserId = groupBy(data, "userId");
    return Object.values(byUserId).map((completions) => {
      const user = completions[0]?.user;
      if (user === undefined) {
        throw new Error("User is undefined");
      }
      return {
        user,
        completions,
      };
    });
  }

  submittedUsers(_: { statusMeansZero: true }) {
    const { data } = this.completionsQueryStore;
    if (data instanceof Status) {
      return 0;
    }
    const userIds = new Set(data.map((c) => c.userId));
    return userIds.size;
  }
}
