CREATE TABLE "pending_video_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cloudflare_stream_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "video" ALTER COLUMN "cloudinary_public_ex_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "video" ALTER COLUMN "cloudinary_secure_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "cloudflare_stream_id" text;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "pending_video_uploads" ADD CONSTRAINT "pending_video_uploads_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pending_video_uploads_cloudflare_stream_id_idx" ON "pending_video_uploads" USING btree ("cloudflare_stream_id");--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_cloudflare_stream_id_idx" ON "video" USING btree ("cloudflare_stream_id");