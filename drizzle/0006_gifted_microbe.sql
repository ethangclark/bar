ALTER TABLE "activity_item" DROP CONSTRAINT "activity_item_info_block_xor_question";--> statement-breakpoint
ALTER TABLE "activity" DROP CONSTRAINT "activity_integration_id_integration_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_item" DROP CONSTRAINT "activity_item_info_block_id_info_text_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_item" DROP CONSTRAINT "activity_item_question_id_question_id_fk";
--> statement-breakpoint
ALTER TABLE "info_text" DROP CONSTRAINT "info_text_info_image_id_info_image_id_fk";
--> statement-breakpoint
DROP INDEX "activity_item_info_block_id_idx";--> statement-breakpoint
DROP INDEX "activity_item_question_id_idx";--> statement-breakpoint
ALTER TABLE "info_text" ADD COLUMN "activity_item_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "info_image" ADD COLUMN "activity_item_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "info_image" ADD COLUMN "text_alternative" text NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "activity_item_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_integration_id_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integration"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "info_text" ADD CONSTRAINT "info_text_activity_item_id_activity_item_id_fk" FOREIGN KEY ("activity_item_id") REFERENCES "public"."activity_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "info_image" ADD CONSTRAINT "info_image_activity_item_id_activity_item_id_fk" FOREIGN KEY ("activity_item_id") REFERENCES "public"."activity_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_activity_item_id_activity_item_id_fk" FOREIGN KEY ("activity_item_id") REFERENCES "public"."activity_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_item" DROP COLUMN "info_block_id";--> statement-breakpoint
ALTER TABLE "activity_item" DROP COLUMN "question_id";--> statement-breakpoint
ALTER TABLE "info_text" DROP COLUMN "info_image_id";