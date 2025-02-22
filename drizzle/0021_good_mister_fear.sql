CREATE TABLE "info_video" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"video_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cloudinary_public_id" text NOT NULL,
	"cloudinary_secure_url" text NOT NULL,
	"cloudinary_audio_url" text,
	"audio_transcript" text
);
--> statement-breakpoint
ALTER TABLE "info_video" ADD CONSTRAINT "info_video_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "info_video" ADD CONSTRAINT "info_video_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "info_video" ADD CONSTRAINT "info_video_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "info_video_activity_id_idx" ON "info_video" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "info_video_item_id_idx" ON "info_video" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "video_cloudinary_public_id_idx" ON "video" USING btree ("cloudinary_public_id");--> statement-breakpoint
CREATE INDEX "video_cloudinary_secure_url_idx" ON "video" USING btree ("cloudinary_secure_url");