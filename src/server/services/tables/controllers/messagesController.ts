import { EnrollmentType } from "~/common/schemas/enrollmentTypeUtils";
import { EditParams, ReadParams, TableController } from "../tableController";
import { eq, and } from "drizzle-orm";
import { DbOrTx } from "~/server/db";
import { db } from "~/server/db";
import { Message } from "~/server/db/schema";

export class MessagesController extends TableController<"messages"> {
  constructor() {
    super("messages");
  }
  canCreate(enrolledAs: EnrollmentType[]): boolean {
    return enrolledAs.includes("student");
  }
  canRead(enrolledAs: EnrollmentType[]): boolean {
    return true;
  }
  canEdit(enrolledAs: EnrollmentType[]): boolean {
    return false;
  }

  async read({ activityId, userId, tx }: ReadParams) {
    const table = db.x.messages;
    return tx
      .select()
      .from(table)
      .where(and(eq(table.activityId, activityId), eq(table.userId, userId)));
  }
  async create({
    activityId,
    rows: rawRows,
    userId,
    tx,
  }: EditParams<"messages">) {
    const table = db.x.messages;
    const rows = rawRows
      .filter(
        (r) =>
          r.activityId === activityId &&
          r.userId === userId &&
          r.senderRole === "user",
      )
      .map(({ id, ...rest }) => ({ ...rest, activityId, userId }));
    return tx.insert(table).values(rows);
  }
  async update() {
    return [];
  }
  async delete() {}
}
