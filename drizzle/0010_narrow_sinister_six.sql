ALTER TABLE "drizzle_course" ADD COLUMN "accepting_enrollments" boolean DEFAULT false;--> statement-breakpoint
UPDATE "drizzle_course" SET "accepting_enrollments" = true;