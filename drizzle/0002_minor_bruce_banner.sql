CREATE TABLE IF NOT EXISTS "drizzle_tutor_chat_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tutoring_session_id" uuid NOT NULL,
	"sender_role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drizzle_tutoring_session" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_tutor_chat_message" ADD CONSTRAINT "drizzle_tutor_chat_message_user_id_drizzle_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."drizzle_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_tutor_chat_message" ADD CONSTRAINT "drizzle_tutor_chat_message_tutoring_session_id_drizzle_tutoring_session_id_fk" FOREIGN KEY ("tutoring_session_id") REFERENCES "public"."drizzle_tutoring_session"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tutor_chat_message_user_id_idx" ON "drizzle_tutor_chat_message" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tutor_chat_message_tutoring_session_id_idx" ON "drizzle_tutor_chat_message" USING btree ("tutoring_session_id");