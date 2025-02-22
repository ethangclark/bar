ALTER TABLE "info_video" ADD COLUMN "numeric_id" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "video" DROP COLUMN "numeric_id";