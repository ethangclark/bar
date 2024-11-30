CREATE TABLE IF NOT EXISTS "drizzle_course_enrollment" (
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	CONSTRAINT "drizzle_course_enrollment_user_id_course_id_pk" PRIMARY KEY("user_id","course_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_course_enrollment" ADD CONSTRAINT "drizzle_course_enrollment_user_id_drizzle_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."drizzle_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_course_enrollment" ADD CONSTRAINT "drizzle_course_enrollment_course_id_drizzle_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."drizzle_course"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
