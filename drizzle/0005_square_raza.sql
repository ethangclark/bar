CREATE TABLE IF NOT EXISTS "drizzle_variant_option" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_type_id" uuid NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_variant_selection" (
	"enrollment_id" uuid NOT NULL,
	"variant_option_id" uuid NOT NULL,
	CONSTRAINT "drizzle_variant_selection_enrollment_id_variant_option_id_pk" PRIMARY KEY("enrollment_id","variant_option_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_variant_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_type_id" uuid NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_variant_option" ADD CONSTRAINT "drizzle_variant_option_variant_type_id_drizzle_variant_type_id_fk" FOREIGN KEY ("variant_type_id") REFERENCES "public"."drizzle_variant_type"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_variant_selection" ADD CONSTRAINT "drizzle_variant_selection_enrollment_id_drizzle_course_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."drizzle_course_enrollment"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_variant_selection" ADD CONSTRAINT "drizzle_variant_selection_variant_option_id_drizzle_variant_option_id_fk" FOREIGN KEY ("variant_option_id") REFERENCES "public"."drizzle_variant_option"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_variant_type" ADD CONSTRAINT "drizzle_variant_type_course_type_id_drizzle_course_type_id_fk" FOREIGN KEY ("course_type_id") REFERENCES "public"."drizzle_course_type"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "variant_option_variant_type_value_idx" ON "drizzle_variant_option" USING btree ("variant_type_id","value");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "variant_type_course_type_id_idx" ON "drizzle_variant_type" USING btree ("course_type_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "variant_type_name_idx" ON "drizzle_variant_type" USING btree ("name");