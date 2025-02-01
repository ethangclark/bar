CREATE TABLE "lock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"max_duration_ms" integer NOT NULL,
	CONSTRAINT "lock_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DROP INDEX "canvas_integration_integration_id_idx";--> statement-breakpoint
DROP INDEX "canvas_integration_base_url_idx";--> statement-breakpoint
DROP INDEX "canvas_user_canvas_global_id_idx";--> statement-breakpoint
ALTER TABLE "canvas_integration" ADD CONSTRAINT "canvas_integration_integration_id_unique" UNIQUE("integration_id");--> statement-breakpoint
ALTER TABLE "canvas_integration" ADD CONSTRAINT "canvas_integration_canvas_base_url_unique" UNIQUE("canvas_base_url");--> statement-breakpoint
ALTER TABLE "canvas_user" ADD CONSTRAINT "canvas_user_canvas_global_id_unique" UNIQUE("canvas_global_id");