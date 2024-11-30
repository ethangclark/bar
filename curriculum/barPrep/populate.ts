import { eq } from "drizzle-orm";
import "~/env";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";
import { getUnits } from "./getUnits";

const courseName = "Bar prep";

async function ensureCourseType() {
  let courseType = await db.query.courseTypes.findFirst({
    where: eq(dbSchema.courseTypes.name, courseName),
  });
  if (!courseType) {
    [courseType] = await db
      .insert(dbSchema.courseTypes)
      .values({
        name: courseName,
      })
      .returning();
  }
  if (!courseType) {
    throw new Error("Failed to create course type");
  }
  return courseType;
}

async function createCourse() {
  const courseType = await ensureCourseType();
  const [course] = await db
    .insert(dbSchema.courses)
    .values({
      typeId: courseType.id,
    })
    .returning();
  if (!course) {
    throw new Error("Failed to create course");
  }
  return course;
}

async function main() {
  const course = await createCourse();

  const units = getUnits();

  await db.transaction(async (db) => {
    await Promise.all(
      units.map(async (unit) => {
        const [unitRecord] = await db
          .insert(dbSchema.units)
          .values({
            courseId: course.id,
            name: unit.name,
          })
          .returning();
        if (!unitRecord) {
          throw new Error("Failed to create unit");
        }
        await Promise.all(
          unit.modules.map(async (module) => {
            const [moduleRecord] = await db
              .insert(dbSchema.modules)
              .values({
                unitId: unitRecord.id,
                name: module.name,
              })
              .returning();
            if (!moduleRecord) {
              throw new Error("Failed to create module");
            }
            await Promise.all(
              module.topics.map(async (topic) => {
                const [topicRecord] = await db
                  .insert(dbSchema.topics)
                  .values({
                    moduleId: moduleRecord.id,
                    name: topic,
                  })
                  .returning();
                if (!topicRecord) {
                  throw new Error("Failed to create topic");
                }
              }),
            );
          }),
        );
      }),
    );
  });
}

void main().then(() => {
  console.log("Done");
});
