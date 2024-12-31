import { makeAutoObservable } from "mobx";
import { Status } from "~/common/utils/status";
import { QueryStore } from "~/common/utils/queryStore";
import { trpc } from "~/trpc/proxy";

const enrollmentQueryStore = new QueryStore(trpc.courses.enrollment.query);

class FocusedEnrollmentStore {
  constructor() {
    makeAutoObservable(this);
  }
  get enrollment() {
    return enrollmentQueryStore.data;
  }
  get course() {
    if (this.enrollment instanceof Status) {
      return this.enrollment;
    }
    return this.enrollment.course;
  }
  get tutoringSessions() {
    if (this.enrollment instanceof Status) {
      return this.enrollment;
    }
    return this.enrollment.tutoringSessions;
  }
  get masteredTopicIds() {
    if (this.enrollment instanceof Status) {
      return this.enrollment;
    }
    return new Set(
      this.enrollment.tutoringSessions
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
    if (this.enrollment instanceof Status) {
      return 0;
    }
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
