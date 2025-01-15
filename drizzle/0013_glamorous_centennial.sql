CREATE TABLE "drizzle_canvas_user" (
	"user_id" uuid NOT NULL,
	"oauth_refresh_token" text NOT NULL,
	"access_token_lifespan_ms" integer
);
--> statement-breakpoint
ALTER TABLE "drizzle_canvas_user" ADD CONSTRAINT "drizzle_canvas_user_user_id_drizzle_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."drizzle_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "canvas_user_user_id_idx" ON "drizzle_canvas_user" USING btree ("user_id");