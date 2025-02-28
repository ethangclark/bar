CREATE TABLE "item_completion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"item_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "item_completion" ADD CONSTRAINT "item_completion_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_completion" ADD CONSTRAINT "item_completion_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_completion" ADD CONSTRAINT "item_completion_thread_id_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_completion" ADD CONSTRAINT "item_completion_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "item_completion_activity_id_idx" ON "item_completion" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "item_completion_user_id_idx" ON "item_completion" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "item_completion_thread_id_idx" ON "item_completion" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "item_completion_item_id_idx" ON "item_completion" USING btree ("item_id");