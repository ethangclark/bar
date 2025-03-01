import { z } from "zod";
import type { DbOrTx } from "~/server/db";
import {
  evalKeySchema,
  infoImageSchema,
  infoTextSchema,
  infoVideoSchema,
  itemCompletionSchema,
  itemSchema,
  messageSchema,
  questionSchema,
  threadSchema,
  viewPieceImagesSchema,
  viewPieceSchema,
  viewPieceTextSchema,
  viewPieceVideoSchema,
} from "~/server/db/schema";
import { clone } from "./cloneUtils";
import type { EnrollmentType } from "./enrollmentTypeUtils";
import { indexById } from "./indexUtils";
import { objectEntries, objectKeys, objectValues } from "./objectUtils";
import type { MaybePromise } from "./types";

// =============================================================================
// Descendent Names, Schemas & Types
// =============================================================================

export const descendentNames = [
  "items",
  "evalKeys",
  "questions",
  "infoTexts",
  "infoImages",
  "infoVideos",
  "threads",
  "messages",
  "viewPieces",
  "viewPieceImages",
  "viewPieceTexts",
  "viewPieceVideos",
  "itemCompletions",
] as const;

export const descendentNamesSchema = z.enum(descendentNames);
export type DescendentName = z.infer<typeof descendentNamesSchema>;

export const descendentsSchema = z.object({
  items: z.array(itemSchema),
  evalKeys: z.array(evalKeySchema),
  questions: z.array(questionSchema),
  infoTexts: z.array(infoTextSchema),
  infoImages: z.array(infoImageSchema),
  infoVideos: z.array(infoVideoSchema),
  threads: z.array(threadSchema),
  messages: z.array(messageSchema),
  viewPieces: z.array(viewPieceSchema),
  viewPieceImages: z.array(viewPieceImagesSchema),
  viewPieceTexts: z.array(viewPieceTextSchema),
  viewPieceVideos: z.array(viewPieceVideoSchema),
  itemCompletions: z.array(itemCompletionSchema),
}) satisfies z.ZodType<{
  [K in DescendentName]: unknown;
}>;

export type Descendents = z.infer<typeof descendentsSchema>;

export type DescendentTables = {
  [K in DescendentName]: { [key: string]: Descendents[K][number] };
};

export type DescendentRows = {
  [K in DescendentName]: Descendents[K][number];
};

export type DescendentRow = {
  id: string;
  activityId: string;
};

// =============================================================================
// Descendent Manipulation Functions
// =============================================================================

export function createEmptyDescendents(): Descendents {
  return descendentNames.reduce((acc, name) => {
    acc[name] = [];
    return acc;
  }, {} as Descendents);
}

export function createEmptyModifications(): Modifications {
  return {
    toCreate: createEmptyDescendents(),
    toUpdate: createEmptyDescendents(),
    toDelete: createEmptyDescendents(),
  };
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

// =============================================================================
// Modifications Schema, Types & Functions
// =============================================================================

export const modificationsSchema = z.object({
  toCreate: descendentsSchema,
  toUpdate: descendentsSchema,
  toDelete: descendentsSchema,
});

export type Modifications = z.infer<typeof modificationsSchema>;

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

    // if objects have been both created and updated, incorporate the update op
    // into the create op and then remove the update op
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

// =============================================================================
// Controller & Permission Types
// =============================================================================

type PermissionParams = {
  userId: string;
  activityId: string;
  enrolledAs: EnrollmentType[];
};

type ActionBaseParams = PermissionParams & {
  tx: DbOrTx;
};

type EditParams<T extends DescendentRow> = ActionBaseParams & {
  rows: T[];
  enqueueSideEffect: (cb: () => MaybePromise<void>) => void;
};

type CreateParams<T extends DescendentRow> = EditParams<T>;
type ReadParams = ActionBaseParams & {
  includeUserIds: string[];
};
type UpdateParams<T extends DescendentRow> = EditParams<T>;
type DeleteParams = ActionBaseParams & {
  ids: string[];
};

export type DescendentController<T extends DescendentRow> = {
  // important: this method has not been implemented in the controllers
  // to check that the activityId on the row matches that in the params;
  // the code leveraging controller.canRead must implement that check
  canRead(descendent: T, params: PermissionParams): boolean;

  create(params: CreateParams<T>): Promise<T[]>;
  read(params: ReadParams): Promise<T[]>;
  update(params: UpdateParams<T>): Promise<T[]>;
  delete(params: DeleteParams): Promise<void>;
};

export type AfterTx = (cb: () => MaybePromise<void>) => void;
