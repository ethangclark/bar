import {
  type DescendentModifications,
  type DescendentTables,
  type Descendents,
} from "~/server/descendents/types";
import { objectEntries, objectKeys, objectValues } from "./objectUtils";
import { descendentNames } from "./descendentNames";
import { indexById } from "./indexUtils";
import { clone } from "./cloneUtils";

export function createEmptyDescendents(): Descendents {
  return descendentNames.reduce((acc, name) => {
    acc[name] = [];
    return acc;
  }, {} as Descendents);
}

export function mergeDescendents(
  descendents: Descendents,
  newDescendents: Descendents,
): Descendents {
  descendentNames.forEach((name) => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const newRows: any = newDescendents[name];
    const newById = indexById(newRows);
    const oldRows = descendents[name];
    const refreshed: any[] = [];
    oldRows.forEach((oldRow) => {
      const newRow = newById[oldRow.id];
      if (newRow) {
        refreshed.push(newRow);
        delete newById[oldRow.id];
      } else {
        refreshed.push(oldRow);
      }
    });
    refreshed.push(...objectValues(newById));
    descendents[name] = refreshed;
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });
  return descendents;
}

export function indexDescendents(descendents: Descendents): DescendentTables {
  return descendentNames.reduce((acc, name) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    acc[name] = indexById(descendents[name] as any);
    return acc;
  }, {} as DescendentTables);
}

export function deindexDescendents(tables: DescendentTables): Descendents {
  return descendentNames.reduce((acc, name) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    acc[name] = objectValues(tables[name]) as any;
    return acc;
  }, {} as Descendents);
}

export function selectDescendents(
  tables: DescendentTables,
  ids: Set<string>,
): Descendents {
  return descendentNames.reduce((acc, name) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    acc[name] = objectValues(tables[name] as any).filter((d) => ids.has(d.id));
    return acc;
  }, {} as Descendents);
}

export function rectifyModifications(
  mods: DescendentModifications,
): DescendentModifications {
  const safeMods = clone(mods);
  const toCreate = indexDescendents(safeMods.toCreate);
  const toUpdate = indexDescendents(safeMods.toUpdate);
  const toDelete = safeMods.toDelete;

  descendentNames.forEach((name) => {
    // ensure deleted objects are not included in the toCreate or toUpdate objects
    const rowsToDelete = toDelete[name];
    rowsToDelete.forEach((row) => {
      delete toCreate[name][row.id];
      delete toUpdate[name][row.id];
    });

    // if objects have been both created and updated, update the update op
    // to be a create op (overwriting the original create op)
    const idxdRowsToUpdate = toUpdate[name];
    objectKeys(idxdRowsToUpdate).forEach((id) => {
      if (toCreate[name][id]) {
        const mod = toUpdate[name][id];
        if (mod) {
          toCreate[name][id] = mod;
          delete toUpdate[name][id];
        }
      }
    });
  });

  return {
    toCreate: deindexDescendents(toCreate),
    toUpdate: deindexDescendents(toUpdate),
    toDelete,
  };
}
