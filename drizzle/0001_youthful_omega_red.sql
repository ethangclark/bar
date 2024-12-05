ALTER TABLE "drizzle_activity" RENAME TO "drizzle_tutoring_session";--> statement-breakpoint
ALTER TABLE "drizzle_tutoring_session" DROP CONSTRAINT "drizzle_activity_user_id_drizzle_user_id_fk";
--> statement-breakpoint
ALTER TABLE "drizzle_tutoring_session" DROP CONSTRAINT "drizzle_activity_topic_id_drizzle_topic_id_fk";
--> statement-breakpoint
ALTER TABLE "drizzle_tutoring_session" DROP CONSTRAINT "drizzle_activity_enrollment_id_drizzle_course_enrollment_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "activity_name_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "activity_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "activity_topic_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "activity_enrollment_id_idx";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_tutoring_session" ADD CONSTRAINT "drizzle_tutoring_session_user_id_drizzle_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."drizzle_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_tutoring_session" ADD CONSTRAINT "drizzle_tutoring_session_topic_id_drizzle_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."drizzle_topic"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_tutoring_session" ADD CONSTRAINT "drizzle_tutoring_session_enrollment_id_drizzle_course_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."drizzle_course_enrollment"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tutoring_session_name_idx" ON "drizzle_tutoring_session" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tutoring_session_user_id_idx" ON "drizzle_tutoring_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tutoring_session_topic_id_idx" ON "drizzle_tutoring_session" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tutoring_session_enrollment_id_idx" ON "drizzle_tutoring_session" USING btree ("enrollment_id");