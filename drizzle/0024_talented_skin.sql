ALTER TABLE "video" RENAME COLUMN "cloudinary_public_id" TO "cloudinary_public_ex_id";--> statement-breakpoint
ALTER TABLE "info_video" DROP CONSTRAINT "info_video_video_id_video_id_fk";
--> statement-breakpoint
DROP INDEX "video_cloudinary_secure_url_idx";--> statement-breakpoint
DROP INDEX "video_cloudinary_public_id_idx";--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "info_video_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_info_video_id_info_video_id_fk" FOREIGN KEY ("info_video_id") REFERENCES "public"."info_video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_cloudinary_public_id_idx" ON "video" USING btree ("cloudinary_public_ex_id");--> statement-breakpoint
ALTER TABLE "info_video" DROP COLUMN "video_id";