ALTER TABLE "drizzle_tutor_chat_message" RENAME TO "drizzle_chat_message";--> statement-breakpoint
ALTER TABLE "drizzle_chat_message" DROP CONSTRAINT "drizzle_tutor_chat_message_user_id_drizzle_user_id_fk";
--> statement-breakpoint
ALTER TABLE "drizzle_chat_message" DROP CONSTRAINT "drizzle_tutor_chat_message_tutoring_session_id_drizzle_tutoring_session_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "tutor_chat_message_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "tutor_chat_message_tutoring_session_id_idx";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_chat_message" ADD CONSTRAINT "drizzle_chat_message_user_id_drizzle_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."drizzle_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_chat_message" ADD CONSTRAINT "drizzle_chat_message_tutoring_session_id_drizzle_tutoring_session_id_fk" FOREIGN KEY ("tutoring_session_id") REFERENCES "public"."drizzle_tutoring_session"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_message_user_id_idx" ON "drizzle_chat_message" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_message_tutoring_session_id_idx" ON "drizzle_chat_message" USING btree ("tutoring_session_id");