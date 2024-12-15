ALTER TABLE "drizzle_course" RENAME COLUMN "variant" TO "flavor";--> statement-breakpoint
DROP INDEX "courses_variant_accepting_enrollments_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "course_flavor_accepting_enrollments_idx" ON "drizzle_course" USING btree (COALESCE("flavor", '___NULL___')) WHERE "drizzle_course"."accepting_enrollments" = true;