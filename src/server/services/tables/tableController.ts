import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { TableName, TableNameToRow } from "./tableSetSchema";
import { db, DbOrTx } from "~/server/db";
import { EnrollmentType } from "~/common/schemas/enrollmentTypeUtils";

export type ReadParams = {
  activityId: string;
  userId: string;
  tx: DbOrTx;
};
export type EditParams<T extends TableName> = ReadParams & {
  rows: TableNameToRow[T][];
};

export abstract class TableController<T extends TableName> {
  constructor(private tableKey: T) {}

  abstract canCreate(enrolledAs: EnrollmentType[]): boolean;
  abstract canRead(enrolledAs: EnrollmentType[]): boolean;
  abstract canEdit(enrolledAs: EnrollmentType[]): boolean;

  read({ activityId, tx }: ReadParams): Promise<TableNameToRow[T][]> {
    const table = (db as any)[this.tableKey];
    return tx
      .select()
      .from(table)
      .where(eq(table.activityId, activityId)) as any;
  }

  create({
    activityId,
    rows: rawRows,
    tx,
  }: EditParams<T>): Promise<TableNameToRow[T][]> {
    const rows = rawRows.filter((r: any) => r.activityId === activityId);
    const table = (db as any)[this.tableKey];
    return tx
      .insert(table)
      .values(rows.map(({ id: _, ...rest }: any) => ({ ...rest })))
      .returning();
  }
  update({
    activityId,
    rows: rawRows,
    tx,
  }: EditParams<T>): Promise<TableNameToRow[T][]> {
    const rows = rawRows.filter((r: any) => r.activityId === activityId);
    const table = (db as any)[this.tableKey];
    return Promise.all(
      rows.map(async (row) => {
        const { id, ...rest } = row as any;
        const result = await tx
          .update(table)
          .set(rest)
          .where(and(eq(table.activityId, activityId), eq(table.id, id)))
          .returning();
        return result[0];
      }),
    ) as any;
  }
  delete({ activityId, rows: rawRows, tx }: EditParams<T>): Promise<void> {
    const rows = rawRows.filter((r: any) => r.activityId === activityId);
    const table = (db as any)[this.tableKey];
    return tx.delete(table).where(
      and(
        eq(table.activityId, activityId),
        inArray(
          table.id,
          rows.map((row: any) => row.id),
        ),
      ),
    ) as any;
  }
}
