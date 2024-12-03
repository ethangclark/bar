CREATE TABLE IF NOT EXISTS "drizzle_understanding_criterion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drizzle_activity" DROP CONSTRAINT "drizzle_activity_topic_id_drizzle_topic_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "activity_topic_id_idx";--> statement-breakpoint
ALTER TABLE "drizzle_activity" ADD COLUMN "understanding_criterion_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "drizzle_activity" ADD COLUMN "understang_criterion_satisfied" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_understanding_criterion" ADD CONSTRAINT "drizzle_understanding_criterion_topic_id_drizzle_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."drizzle_topic"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "understanding_criterion_topic_id_idx" ON "drizzle_understanding_criterion" USING btree ("topic_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_activity" ADD CONSTRAINT "drizzle_activity_understanding_criterion_id_drizzle_understanding_criterion_id_fk" FOREIGN KEY ("understanding_criterion_id") REFERENCES "public"."drizzle_understanding_criterion"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_understanding_criterion_id_idx" ON "drizzle_activity" USING btree ("understanding_criterion_id");--> statement-breakpoint
ALTER TABLE "drizzle_activity" DROP COLUMN IF EXISTS "topic_id";--> statement-breakpoint
ALTER TABLE "drizzle_activity" DROP COLUMN IF EXISTS "topic_mastery_proved";