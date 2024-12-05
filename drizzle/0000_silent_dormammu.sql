CREATE TABLE IF NOT EXISTS "drizzle_account" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "drizzle_account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"conclusion" text,
	"demonstrates_mastery" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_course_enrollment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_course_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_course" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type_id" uuid NOT NULL,
	"creation_date" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_ip_user" (
	"ip_address" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_module" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"unit_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_session" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_topic" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"module_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_unit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"course_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone DEFAULT now(),
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"image" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "drizzle_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_account" ADD CONSTRAINT "drizzle_account_user_id_drizzle_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."drizzle_user"("id") ON DELETE cascade ON UPDATE no action;
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
 ALTER TABLE "drizzle_activity" ADD CONSTRAINT "drizzle_activity_topic_id_drizzle_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."drizzle_topic"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_activity" ADD CONSTRAINT "drizzle_activity_enrollment_id_drizzle_course_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."drizzle_course_enrollment"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
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
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "drizzle_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_name_idx" ON "drizzle_activity" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_user_id_idx" ON "drizzle_activity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_topic_id_idx" ON "drizzle_activity" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_enrollment_id_idx" ON "drizzle_activity" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "course_enrollment_user_id_idx" ON "drizzle_course_enrollment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "course_enrollment_course_id_idx" ON "drizzle_course_enrollment" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "course_type_name_idx" ON "drizzle_course_type" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "course_type_id_idx" ON "drizzle_course" USING btree ("type_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ip_user_user_id_idx" ON "drizzle_ip_user" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "module_unit_id_idx" ON "drizzle_module" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "module_name_idx" ON "drizzle_module" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_created_by_id_idx" ON "drizzle_post" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_name_idx" ON "drizzle_post" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "drizzle_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "topic_module_id_idx" ON "drizzle_topic" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "topic_name_idx" ON "drizzle_topic" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "unit_course_id_idx" ON "drizzle_unit" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "unit_name_idx" ON "drizzle_unit" USING btree ("name");