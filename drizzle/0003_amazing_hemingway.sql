DROP INDEX IF EXISTS "tutoring_session_name_idx";--> statement-breakpoint
ALTER TABLE "drizzle_tutoring_session" DROP COLUMN IF EXISTS "name";