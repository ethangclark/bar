import { db } from "~/server/db";
import jurisdictions from "./jurisdictions.json";
import { dbSchema } from "~/server/db/dbSchema";
import { eq } from "drizzle-orm";
import { barExamPrep } from "dataPopulation/utils/constants";
import { type Course } from "~/server/db/schema";

export async function createJurisdictionCourses() {
  const [courseType, ...excess] = await db.query.courseTypes.findMany({
    where: eq(dbSchema.courseTypes.name, barExamPrep),
    with: {
      courses: {
        with: {
          courseType: true,
          units: {
            with: {
              modules: {
                with: {
                  topics: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!courseType || excess.length) {
    throw new Error(`Singular ${barExamPrep} course type not found`);
  }
  const [generalCourse, ...excess2] = courseType.courses.filter(
    (c) => c.flavor === null,
  );
  if (!generalCourse || excess2.length) {
    throw new Error(`Singular general ${barExamPrep} course not found`);
  }
  const jurisdictionCourses = Array<Course>();
  for (const jurisdiction of jurisdictions) {
    const [newCourse] = await db
      .insert(dbSchema.courses)
      .values({
        typeId: courseType.id,
        flavor: jurisdiction,
      })
      .returning();
    if (!newCourse) {
      throw new Error(
        `Failed to create course for ${jurisdiction}; quitting (you'll have to clean this up manually)`,
      );
    }
    jurisdictionCourses.push(newCourse);
  }
  return { jurisdictionCourses, generalCourse };
}
