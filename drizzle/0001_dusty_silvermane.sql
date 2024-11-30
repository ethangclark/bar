ALTER TABLE "drizzle_account" DROP CONSTRAINT "drizzle_account_user_id_drizzle_user_id_fk";
--> statement-breakpoint
ALTER TABLE "drizzle_activity" DROP CONSTRAINT "drizzle_activity_topic_id_drizzle_topic_id_fk";
--> statement-breakpoint
ALTER TABLE "drizzle_activity" DROP CONSTRAINT "drizzle_activity_user_id_drizzle_user_id_fk";
--> statement-breakpoint
ALTER TABLE "drizzle_course" DROP CONSTRAINT "drizzle_course_type_id_drizzle_course_type_id_fk";
--> statement-breakpoint
ALTER TABLE "drizzle_ip_user" DROP CONSTRAINT "drizzle_ip_user_user_id_drizzle_user_id_fk";
--> statement-breakpoint
ALTER TABLE "drizzle_module" DROP CONSTRAINT "drizzle_module_unit_id_drizzle_unit_id_fk";
--> statement-breakpoint
ALTER TABLE "drizzle_post" DROP CONSTRAINT "drizzle_post_created_by_id_drizzle_user_id_fk";
--> statement-breakpoint
ALTER TABLE "drizzle_session" DROP CONSTRAINT "drizzle_session_user_id_drizzle_user_id_fk";
--> statement-breakpoint
ALTER TABLE "drizzle_topic" DROP CONSTRAINT "drizzle_topic_module_id_drizzle_module_id_fk";
--> statement-breakpoint
ALTER TABLE "drizzle_unit" DROP CONSTRAINT "drizzle_unit_course_id_drizzle_course_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_account" ADD CONSTRAINT "drizzle_account_user_id_drizzle_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."drizzle_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_activity" ADD CONSTRAINT "drizzle_activity_topic_id_drizzle_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."drizzle_topic"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_activity" ADD CONSTRAINT "drizzle_activity_user_id_drizzle_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."drizzle_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_course" ADD CONSTRAINT "drizzle_course_type_id_drizzle_course_type_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."drizzle_course_type"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_ip_user" ADD CONSTRAINT "drizzle_ip_user_user_id_drizzle_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."drizzle_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_module" ADD CONSTRAINT "drizzle_module_unit_id_drizzle_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."drizzle_unit"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_post" ADD CONSTRAINT "drizzle_post_created_by_id_drizzle_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."drizzle_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_session" ADD CONSTRAINT "drizzle_session_user_id_drizzle_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."drizzle_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_topic" ADD CONSTRAINT "drizzle_topic_module_id_drizzle_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."drizzle_module"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_unit" ADD CONSTRAINT "drizzle_unit_course_id_drizzle_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."drizzle_course"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
