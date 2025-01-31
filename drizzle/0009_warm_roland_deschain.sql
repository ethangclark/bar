DROP INDEX "message_sender_role_idx";--> statement-breakpoint
ALTER TABLE "thread" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "thread_user_id_idx" ON "thread" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "message" DROP COLUMN "insert_order";