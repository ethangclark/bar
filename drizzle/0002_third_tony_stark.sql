DROP INDEX "activity_due_at_idx";--> statement-breakpoint
ALTER TABLE "activity" ALTER COLUMN "integration_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_integration_id_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_ex_id_json_idx" ON "activity" USING btree ("ex_id_json");--> statement-breakpoint
ALTER TABLE "activity" DROP COLUMN "due_at";