DROP INDEX "canvas_user_canvas_global_id_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "canvas_user_canvas_global_id_idx" ON "drizzle_canvas_user" USING btree ("canvas_global_id");