import { objectValues } from "~/common/utils/objectUtils";
import { createEmptyTables, rowsToTable } from "~/common/utils/tableUtils";
import { DbOrTx } from "../../db";
import { controllers } from "./controllers";
import { tableNames, TableSet } from "./tableSetSchema";

export async function insertTables(
  activityId: string,
  tables: TableSet,
  tx: DbOrTx,
) {
  const result = createEmptyTables();
  await Promise.all(
    tableNames.map(async (key) => {
      const rowsIn = objectValues(tables[key]);
      const rowsOut = (await controllers[key].create(
        activityId,
        rowsIn as any,
        tx,
      )) as any;
      rowsOut[key] = rowsToTable(rowsOut);
    }),
  );
  return result;
}

export async function updateTables(
  activityId: string,
  tables: TableSet,
  tx: DbOrTx,
) {
  const result = createEmptyTables();
  await Promise.all(
    tableNames.map(async (key) => {
      const rowsIn = objectValues(tables[key]);
      const rowsOut = (await controllers[key].update(
        activityId,
        rowsIn as any,
        tx,
      )) as any;
      rowsOut[key] = rowsToTable(rowsOut);
    }),
  );
  return result;
}

export async function deleteTables(
  activityId: string,
  tables: TableSet,
  tx: DbOrTx,
) {
  await Promise.all(
    tableNames.map(async (key) => {
      await controllers[key].delete(activityId, tables[key] as any, tx);
    }),
  );
}
