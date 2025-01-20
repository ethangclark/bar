CREATE TABLE "info_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "info_block" RENAME TO "info_text";--> statement-breakpoint
ALTER TABLE "info_text" DROP CONSTRAINT "info_block_activity_item_id_activity_item_id_fk";
--> statement-breakpoint
ALTER TABLE "question" DROP CONSTRAINT "question_activity_item_id_activity_id_fk";
--> statement-breakpoint
DROP INDEX "activity_int_id_idx";--> statement-breakpoint
DROP INDEX "canvas_int_int_id_idx";--> statement-breakpoint
DROP INDEX "info_block_activity_item_id_idx";--> statement-breakpoint
DROP INDEX "question_activity_item_id_idx";--> statement-breakpoint
ALTER TABLE "activity_item" ADD COLUMN "question_id" uuid;--> statement-breakpoint
ALTER TABLE "activity_item" ADD COLUMN "info_text_id" uuid;--> statement-breakpoint
ALTER TABLE "activity_item" ADD COLUMN "info_image_id" uuid;--> statement-breakpoint
ALTER TABLE "info_text" ADD COLUMN "content" text NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "content" text NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_item" ADD CONSTRAINT "activity_item_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_item" ADD CONSTRAINT "activity_item_info_text_id_info_text_id_fk" FOREIGN KEY ("info_text_id") REFERENCES "public"."info_text"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_item" ADD CONSTRAINT "activity_item_info_image_id_info_image_id_fk" FOREIGN KEY ("info_image_id") REFERENCES "public"."info_image"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_integration_id_idx" ON "activity" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "canvas_integration_id_idx" ON "canvas_integration" USING btree ("integration_id");--> statement-breakpoint
ALTER TABLE "info_text" DROP COLUMN "activity_item_id";--> statement-breakpoint
ALTER TABLE "question" DROP COLUMN "activity_item_id";