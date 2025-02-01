ALTER TABLE "activity_item" RENAME TO "item";--> statement-breakpoint
ALTER TABLE "info_image" RENAME COLUMN "activity_item_id" TO "item_id";--> statement-breakpoint
ALTER TABLE "info_text" RENAME COLUMN "activity_item_id" TO "item_id";--> statement-breakpoint
ALTER TABLE "question" RENAME COLUMN "activity_item_id" TO "item_id";--> statement-breakpoint
ALTER TABLE "thread" RENAME COLUMN "activity_item_id" TO "item_id";--> statement-breakpoint
ALTER TABLE "item" DROP CONSTRAINT "activity_item_activity_id_activity_id_fk";
--> statement-breakpoint
ALTER TABLE "info_image" DROP CONSTRAINT "info_image_activity_item_id_activity_item_id_fk";
--> statement-breakpoint
ALTER TABLE "info_text" DROP CONSTRAINT "info_text_activity_item_id_activity_item_id_fk";
--> statement-breakpoint
ALTER TABLE "question" DROP CONSTRAINT "question_activity_item_id_activity_item_id_fk";
--> statement-breakpoint
ALTER TABLE "thread" DROP CONSTRAINT "thread_activity_item_id_activity_item_id_fk";
--> statement-breakpoint
DROP INDEX "activity_item_activity_id_idx";--> statement-breakpoint
DROP INDEX "info_image_activity_item_id_idx";--> statement-breakpoint
DROP INDEX "info_text_activity_item_id_idx";--> statement-breakpoint
DROP INDEX "question_activity_item_id_idx";--> statement-breakpoint
DROP INDEX "thread_activity_item_id_idx";--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "info_image" ADD CONSTRAINT "info_image_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "info_text" ADD CONSTRAINT "info_text_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "item_activity_id_idx" ON "item" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "info_image_item_id_idx" ON "info_image" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "info_text_item_id_idx" ON "info_text" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "question_item_id_idx" ON "question" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "thread_item_id_idx" ON "thread" USING btree ("item_id");