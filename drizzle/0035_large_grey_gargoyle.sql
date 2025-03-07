ALTER TABLE "completion" DROP CONSTRAINT "completion_message_id_unique";--> statement-breakpoint
CREATE INDEX "completion_message_id_idx" ON "completion" USING btree ("message_id");