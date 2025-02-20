import {
  type DescendentTables,
  type Descendents,
  type Modifications,
} from "~/server/descendents/descendentTypes";
import { clone } from "./cloneUtils";
import { descendentNames } from "./descendentNames";
import { indexById } from "./indexUtils";
import { objectEntries, objectKeys, objectValues } from "./objectUtils";

export function isUuid(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export function createEmptyDescendents(): Descendents {
  return descendentNames.reduce((acc, name) => {
    acc[name] = [];
    return acc;
  }, {} as Descendents);
}

export function indexDescendents(descendents: Descendents): DescendentTables {
  return descendentNames.reduce((acc, name) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    acc[name] = indexById(descendents[name] as any);
    return acc;
  }, {} as DescendentTables);
}

export function upsertDescendents(
  tables: DescendentTables,
  descendents: Descendents,
) {
  objectEntries(descendents).forEach(([name, rows]) => {
    rows.forEach((row) => {
      if (tables[name][row.id] === undefined) {
        tables[name][row.id] = row;
      } else {
        objectEntries(row).forEach(([key, value]) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          if (tables[name][row.id]![key] !== value) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            tables[name][row.id]![key] = value;
          }
        });
      }
    });
  });
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

// TODO: handle cascading deletes based off of foreign keys :/
export function rectifyModifications(mods: Modifications): Modifications {
  function deindexDescendents(tables: DescendentTables): Descendents {
    const deindexed = createEmptyDescendents();
    objectEntries(tables).forEach(([name, indexed]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deindexed[name] = objectValues(indexed) as any;
    });
    return deindexed;
  }

  const safeMods = clone(mods);
  const toCreate = indexDescendents(safeMods.toCreate);
  const toUpdate = indexDescendents(safeMods.toUpdate);
  const toDelete = safeMods.toDelete;

  const deletedIds = new Set<string>();
  descendentNames.forEach((name) => {
    const rowsToDelete = toDelete[name];
    rowsToDelete.forEach((row) => {
      deletedIds.add(row.id);
    });
  });

  descendentNames.forEach((name) => {
    // ensure deleted objects are not included in the toCreate or toUpdate objects
    const rowsToDelete = toDelete[name];
    rowsToDelete.forEach((row) => {
      delete toCreate[name][row.id];
      delete toUpdate[name][row.id];
    });

    // Do not create or update rows that reference deleted rows --
    // we assume that rows always have an "on delete cascade" condition for rows they reference.
    // (We could add a test that uses an LLM to check for this.)
    objectValues({ toCreate, toUpdate }).forEach((descendents) => {
      objectEntries(descendents[name]).forEach(([id, row]) => {
        objectValues(row).forEach((value) => {
          if (typeof value === "string" && deletedIds.has(value)) {
            delete descendents[name][id];
          }
        });
      });
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
