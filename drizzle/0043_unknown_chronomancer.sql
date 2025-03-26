ALTER TABLE "flag" ADD COLUMN "admin_note" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "flag" ADD COLUMN "admin_checked" boolean DEFAULT false NOT NULL;