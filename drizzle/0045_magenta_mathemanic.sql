CREATE TYPE "public"."message_status" AS ENUM('incomplete', 'completeWithViewPieces', 'completeWithoutViewPieces');--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "status" "message_status" DEFAULT 'completeWithoutViewPieces' NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "message" DROP COLUMN "done_generating";