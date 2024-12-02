ALTER TABLE "drizzle_activity" ADD COLUMN "enrollment_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "drizzle_activity" ADD COLUMN "done" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "drizzle_activity" ADD COLUMN "topic_mastery_proved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_activity" ADD CONSTRAINT "drizzle_activity_enrollment_id_drizzle_course_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."drizzle_course_enrollment"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_enrollment_id_idx" ON "drizzle_activity" USING btree ("enrollment_id");