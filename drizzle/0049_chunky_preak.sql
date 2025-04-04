DROP INDEX "user_unverified_email_idx";--> statement-breakpoint
DROP INDEX "user_login_token_hash_idx";--> statement-breakpoint
DELETE FROM "user" WHERE "email" IS NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "user_set_password_token_hash_idx" ON "user" USING btree ("set_password_token_hash");--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "unverified_email";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "login_token_hash";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "login_token_created_at";--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_email_unique" UNIQUE("email");