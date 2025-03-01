CREATE TABLE "error" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_address" text NOT NULL,
	"user_id" uuid,
	"message" text NOT NULL,
	"details_super_json_string" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "error" ADD CONSTRAINT "error_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "error_ip_address_idx" ON "error" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "error_user_id_idx" ON "error" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "error_created_at_idx" ON "error" USING btree ("created_at");