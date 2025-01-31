import { type ActivityDescendents } from "~/server/activityDescendents/types";
import { objectEntries, objectValues } from "./objectUtils";
import { activityDescendentNames } from "./activityDescendentNames";
import { indexById } from "./indexUtils";

export function selectDescendentsByIds(
  descendents: ActivityDescendents,
  ids: Set<string>,
): ActivityDescendents {
  const result: Partial<ActivityDescendents> = {};
  objectEntries(descendents).forEach(([name, record]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result[name] = record.filter((d) => ids.has(d.id)) as any;
  });
  return result as ActivityDescendents;
}

export function overwriteDescendents(
  descendents: ActivityDescendents,
  newDescendents: ActivityDescendents,
): ActivityDescendents {
  activityDescendentNames.forEach((name) => {
    const newRows = newDescendents[name];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newById = indexById(newRows as any);
    const oldRows = descendents[name];
    const refreshed: typeof newRows = [];
    oldRows.forEach((oldRow) => {
      const newRow = newById[oldRow.id];
      if (newRow) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        refreshed.push(newRow as any);
        delete newById[oldRow.id];
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        refreshed.push(oldRow as any);
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    refreshed.push(...(objectValues(newById) as any));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descendents[name] = refreshed as any;
  });
  return descendents;
}
