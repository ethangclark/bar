ALTER TABLE "message" RENAME COLUMN "completed" TO "done_generating";--> statement-breakpoint
ALTER TABLE "completion" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;