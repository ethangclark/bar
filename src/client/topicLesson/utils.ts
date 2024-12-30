import { type TutoringSession } from "~/server/db/schema";
import { formatDateTime } from "~/common/utils/timeUtils";

// Optionally house your utility functions here

export function sortSessionsEarliestFirst(sessions: TutoringSession[]) {
  return sessions
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function getMostRecentSession(sessions: TutoringSession[]) {
  return sortSessionsEarliestFirst(sessions).slice().pop() ?? null;
}

export function getSessionLabel(session: TutoringSession, idx: number) {
  return `Session ${idx + 1}: ${formatDateTime(session.createdAt)}`;
}
