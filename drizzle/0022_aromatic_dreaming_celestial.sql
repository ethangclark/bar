ALTER TABLE "info_video" ADD COLUMN "text_alternative" text NOT NULL;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "numeric_id" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "video" DROP COLUMN "audio_transcript";