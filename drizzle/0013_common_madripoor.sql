CREATE TABLE "enriched_message_view_piece" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "view_piece_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"view_piece_id" uuid NOT NULL,
	"info_image_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "view_piece_text" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"view_piece_id" uuid NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "info_image" ADD COLUMN "numeric_id" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "enriched_message_view_piece" ADD CONSTRAINT "enriched_message_view_piece_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_piece_image" ADD CONSTRAINT "view_piece_image_view_piece_id_enriched_message_view_piece_id_fk" FOREIGN KEY ("view_piece_id") REFERENCES "public"."enriched_message_view_piece"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_piece_image" ADD CONSTRAINT "view_piece_image_info_image_id_info_image_id_fk" FOREIGN KEY ("info_image_id") REFERENCES "public"."info_image"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_piece_text" ADD CONSTRAINT "view_piece_text_view_piece_id_enriched_message_view_piece_id_fk" FOREIGN KEY ("view_piece_id") REFERENCES "public"."enriched_message_view_piece"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "info_image_numeric_id_idx" ON "info_image" USING btree ("numeric_id");