ALTER TABLE "drizzle_course_enrollment" RENAME TO "drizzle_enrollment";--> statement-breakpoint
ALTER TABLE "drizzle_course" RENAME COLUMN "creation_date" TO "created_at";--> statement-breakpoint
ALTER TABLE "drizzle_enrollment" DROP CONSTRAINT "drizzle_course_enrollment_user_id_drizzle_user_id_fk";
--> statement-breakpoint
ALTER TABLE "drizzle_enrollment" DROP CONSTRAINT "drizzle_course_enrollment_course_id_drizzle_course_id_fk";
--> statement-breakpoint
ALTER TABLE "drizzle_tutoring_session" DROP CONSTRAINT "drizzle_tutoring_session_enrollment_id_drizzle_course_enrollment_id_fk";
--> statement-breakpoint
ALTER TABLE "drizzle_variant_selection" DROP CONSTRAINT "drizzle_variant_selection_enrollment_id_drizzle_course_enrollment_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "course_enrollment_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "course_enrollment_course_id_idx";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_enrollment" ADD CONSTRAINT "drizzle_enrollment_user_id_drizzle_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."drizzle_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_enrollment" ADD CONSTRAINT "drizzle_enrollment_course_id_drizzle_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."drizzle_course"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_tutoring_session" ADD CONSTRAINT "drizzle_tutoring_session_enrollment_id_drizzle_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."drizzle_enrollment"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_variant_selection" ADD CONSTRAINT "drizzle_variant_selection_enrollment_id_drizzle_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."drizzle_enrollment"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollment_user_id_idx" ON "drizzle_enrollment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollment_course_id_idx" ON "drizzle_enrollment" USING btree ("course_id");