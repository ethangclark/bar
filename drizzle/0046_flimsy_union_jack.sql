-- First add the column as nullable
ALTER TABLE "flag" ADD COLUMN "thread_id" uuid;--> statement-breakpoint

-- Update existing records by setting thread_id to the thread_id from the message
UPDATE "flag" SET "thread_id" = "message"."thread_id" FROM "message" WHERE "flag"."message_id" = "message"."id";--> statement-breakpoint

-- Now make the column non-nullable
ALTER TABLE "flag" ALTER COLUMN "thread_id" SET NOT NULL;--> statement-breakpoint

-- Add the foreign key constraint
ALTER TABLE "flag" ADD CONSTRAINT "flag_thread_id_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."thread"("id") ON DELETE cascade ON UPDATE no action;
