import { identity } from "@trpc/server/unstable-core-do-not-import";
import {
  Activity,
  ActivityItem,
  Question,
  InfoText,
  InfoImage,
  EvalKey,
  Message,
  Thread,
} from "~/server/db/schema";
import { objectKeys } from "./objectUtils";

export function createEmptyTables(): TableSet {
  return {
    activities: identity<Record<string, Activity>>({}),
    activityItems: identity<Record<string, ActivityItem>>({}),
    questions: identity<Record<string, Question>>({}),
    infoTexts: identity<Record<string, InfoText>>({}),
    infoImages: identity<Record<string, InfoImage>>({}),
    evalKeys: identity<Record<string, EvalKey>>({}),
    threads: identity<Record<string, Thread>>({}),
    messages: identity<Record<string, Message>>({}),
  };
}

export function rowsToTable<T extends { id: string }>(
  array: T[],
): Record<string, T> {
  return array.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, identity<Record<string, T>>({}));
}
