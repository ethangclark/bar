ALTER TABLE "activity_item" RENAME COLUMN "info_text_id" TO "info_block_id";--> statement-breakpoint
ALTER TABLE "activity_item" DROP CONSTRAINT "activity_item_info_text_id_info_text_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_item" DROP CONSTRAINT "activity_item_info_image_id_info_image_id_fk";
--> statement-breakpoint
ALTER TABLE "info_text" ADD COLUMN "info_image_id" uuid;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "insert_order" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_item" ADD CONSTRAINT "activity_item_info_block_id_info_text_id_fk" FOREIGN KEY ("info_block_id") REFERENCES "public"."info_text"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "info_text" ADD CONSTRAINT "info_text_info_image_id_info_image_id_fk" FOREIGN KEY ("info_image_id") REFERENCES "public"."info_image"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_item_info_block_id_idx" ON "activity_item" USING btree ("info_block_id");--> statement-breakpoint
CREATE INDEX "activity_item_question_id_idx" ON "activity_item" USING btree ("question_id");--> statement-breakpoint
ALTER TABLE "activity_item" DROP COLUMN "info_image_id";--> statement-breakpoint
ALTER TABLE "activity_item" ADD CONSTRAINT "activity_item_info_block_xor_question" CHECK (("activity_item"."info_block_id" IS NOT NULL AND "activity_item"."question_id" IS NULL) OR ("activity_item"."info_block_id" IS NULL AND "activity_item"."question_id" IS NOT NULL));