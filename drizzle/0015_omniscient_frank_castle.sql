ALTER TABLE "drizzle_canvas_user" ADD COLUMN "ex_canvas_global_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "drizzle_canvas_user" ADD COLUMN "ex_canvas_non_global_id_bkp" text;--> statement-breakpoint
ALTER TABLE "drizzle_canvas_user" ADD COLUMN "ex_canvas_user_name" text NOT NULL;