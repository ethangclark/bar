DELETE FROM "item_completion";
ALTER TABLE "item_completion" RENAME TO "completion";--> statement-breakpoint
ALTER TABLE "completion" DROP CONSTRAINT "item_completion_activity_id_activity_id_fk";
--> statement-breakpoint
ALTER TABLE "completion" DROP CONSTRAINT "item_completion_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "completion" DROP CONSTRAINT "item_completion_thread_id_thread_id_fk";
--> statement-breakpoint
ALTER TABLE "completion" DROP CONSTRAINT "item_completion_item_id_item_id_fk";
--> statement-breakpoint
DROP INDEX "item_completion_activity_id_idx";--> statement-breakpoint
DROP INDEX "item_completion_user_id_idx";--> statement-breakpoint
DROP INDEX "item_completion_thread_id_idx";--> statement-breakpoint
DROP INDEX "item_completion_item_id_idx";--> statement-breakpoint
ALTER TABLE "completion" ADD COLUMN "message_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "completion" ADD CONSTRAINT "completion_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completion" ADD CONSTRAINT "completion_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completion" ADD CONSTRAINT "completion_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completion" ADD CONSTRAINT "completion_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "completion_activity_id_idx" ON "completion" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "completion_user_id_idx" ON "completion" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "completion_item_id_idx" ON "completion" USING btree ("item_id");--> statement-breakpoint
ALTER TABLE "completion" DROP COLUMN "thread_id";--> statement-breakpoint
ALTER TABLE "completion" ADD CONSTRAINT "completion_message_id_unique" UNIQUE("message_id");