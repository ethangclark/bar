CREATE TYPE "public"."activity_status" AS ENUM('draft', 'published');--> statement-breakpoint
ALTER TABLE "activity" ADD COLUMN "status" "activity_status" DEFAULT 'draft' NOT NULL;