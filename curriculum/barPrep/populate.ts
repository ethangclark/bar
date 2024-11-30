import { db } from "~/server/db";
import { getUnits } from "./getUnits";
import { dbSchema } from "~/server/db/dbSchema";

const courseName = "Bar prep";

async function main() {
  const units = getUnits();

  await Promise.all(
    units.map(async (unit) => {
      const [unitRecord] = await db
        .insert(dbSchema.units)
        .values({
          name: unit.name,
        })
        .returning();
    }),
  );
}

void main();
