ALTER TABLE "video" DROP CONSTRAINT "video_info_video_id_info_video_id_fk";
--> statement-breakpoint
ALTER TABLE "info_video" ADD COLUMN "video_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "info_video" ADD CONSTRAINT "info_video_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "info_video_video_id_idx" ON "info_video" USING btree ("video_id");--> statement-breakpoint
ALTER TABLE "video" DROP COLUMN "info_video_id";