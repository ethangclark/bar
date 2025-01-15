ALTER TABLE "drizzle_canvas_user" RENAME COLUMN "ex_canvas_global_id" TO "canvas_global_id";--> statement-breakpoint
ALTER TABLE "drizzle_canvas_user" RENAME COLUMN "ex_canvas_non_global_id_bkp" TO "non_global_ids_arr_json";--> statement-breakpoint
ALTER TABLE "drizzle_canvas_user" RENAME COLUMN "ex_canvas_user_name" TO "canvas_user_name";