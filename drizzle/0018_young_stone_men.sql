ALTER TABLE "user" ADD COLUMN "login_token_hash" text;--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_unverified_email_idx" ON "user" USING btree ("unverified_email");--> statement-breakpoint
CREATE INDEX "user_login_token_hash_idx" ON "user" USING btree ("login_token_hash");--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "refreshed_at";