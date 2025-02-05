ALTER TABLE "thread" DROP CONSTRAINT "thread_item_id_item_id_fk";
--> statement-breakpoint
DROP INDEX "thread_item_id_idx";--> statement-breakpoint
ALTER TABLE "thread" DROP COLUMN "item_id";