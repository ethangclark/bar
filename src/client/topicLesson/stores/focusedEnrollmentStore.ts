import { makeAutoObservable } from "mobx";
import { QueryStore } from "~/common/utils/queryStore";
import { trpc } from "~/trpc/proxy";

const enrollmentQueryStore = new QueryStore(trpc.courses.enrollment.query);

class FocusedEnrollmentStore {
  constructor() {
    makeAutoObservable(this);
  }
  get isLoading() {
    return enrollmentQueryStore.isLoading;
  }
  get hasLoadedOnce() {
    return enrollmentQueryStore.hasLoadedOnce;
  }
  get enrollment() {
    return enrollmentQueryStore.data;
  }
  get course() {
    return this.enrollment?.course ?? null;
  }
  get tutoringSessions() {
    return this.enrollment?.tutoringSessions ?? [];
  }
  get masteredTopicIds() {
    return new Set(
      (this.enrollment?.tutoringSessions ?? [])
        .filter((a) => a.demonstratesMastery)
        .map((a) => a.topicId),
    );
  }
  async loadEnrollment(enrollmentId: string) {
    return await enrollmentQueryStore.fetch({ enrollmentId });
  }
  async refetchEnrollment() {
    return await enrollmentQueryStore.refetch();
  }
  get totalTopics() {
    let total = 0;
    this.enrollment?.course.units.forEach((unit) => {
      unit.modules.forEach((module) => {
        total += module.topics.length;
      });
    });
    return total;
  }
}

export const focusedEnrollmentStore = new FocusedEnrollmentStore();
