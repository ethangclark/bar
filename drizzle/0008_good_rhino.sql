ALTER TABLE "activity" RENAME COLUMN "ex_id_json" TO "ex_assignment_id_json";--> statement-breakpoint
DROP INDEX "canvas_integration_id_idx";--> statement-breakpoint
DROP INDEX "canvas_int_base_url_idx";--> statement-breakpoint
DROP INDEX "activity_ex_assignment_id_json_idx";--> statement-breakpoint
ALTER TABLE "eval_key" ADD COLUMN "activity_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "info_image" ADD COLUMN "activity_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "info_text" ADD COLUMN "activity_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "activity_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "activity_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "thread" ADD COLUMN "activity_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "eval_key" ADD CONSTRAINT "eval_key_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "info_image" ADD CONSTRAINT "info_image_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "info_text" ADD CONSTRAINT "info_text_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "canvas_integration_integration_id_idx" ON "canvas_integration" USING btree ("integration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "canvas_integration_base_url_idx" ON "canvas_integration" USING btree ("canvas_base_url");--> statement-breakpoint
CREATE INDEX "eval_key_activity_id_idx" ON "eval_key" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "eval_key_question_id_idx" ON "eval_key" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "info_image_activity_id_idx" ON "info_image" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "info_image_activity_item_id_idx" ON "info_image" USING btree ("activity_item_id");--> statement-breakpoint
CREATE INDEX "info_text_activity_id_idx" ON "info_text" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "info_text_activity_item_id_idx" ON "info_text" USING btree ("activity_item_id");--> statement-breakpoint
CREATE INDEX "message_sender_role_idx" ON "message" USING btree ("sender_role");--> statement-breakpoint
CREATE INDEX "message_activity_id_idx" ON "message" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "question_activity_id_idx" ON "question" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "question_activity_item_id_idx" ON "question" USING btree ("activity_item_id");--> statement-breakpoint
CREATE INDEX "thread_activity_id_idx" ON "thread" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "thread_activity_item_id_idx" ON "thread" USING btree ("activity_item_id");--> statement-breakpoint
CREATE INDEX "activity_ex_assignment_id_json_idx" ON "activity" USING btree ("ex_assignment_id_json");