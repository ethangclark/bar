ALTER TABLE "user" ADD COLUMN "requested_ad_hoc_instructor_access" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_ad_hoc_instructor" boolean DEFAULT false NOT NULL;

UPDATE "user" SET "is_ad_hoc_instructor" = true;
