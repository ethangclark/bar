import { makeAutoObservable } from "mobx";
import { clone } from "~/common/utils/cloneUtils";
import { objectAssign } from "~/common/utils/objectUtils";
import { createEmptyTables } from "~/common/utils/tableUtils";
import { TableToRow, TableSet, TableKey } from "~/server/db/schema";

export class TableStore {
  public tables = createEmptyTables();

  constructor() {
    makeAutoObservable(this);
  }

  public drafts = createEmptyTables();

  public save() {}
  public updateDraft<T extends TableKey>(
    tableType: T,
    data: { id: string } & Partial<TableToRow[T]>,
  ) {
    const draftTable = this.drafts[tableType];
    let draftRow = draftTable[data.id];
    if (!draftRow) {
      const savedRow = this.tables[tableType][data.id];
      if (!savedRow) {
        throw new Error("Row not found");
      }
      draftRow = clone(savedRow);
      draftTable[data.id] = draftRow;
    }
    objectAssign(draftTable[data.id], data);
  }
}
