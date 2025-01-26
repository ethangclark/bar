CREATE TABLE "eval_key" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"key" text NOT NULL
);
--> statement-breakpoint
DROP INDEX "activity_ex_id_json_idx";--> statement-breakpoint
ALTER TABLE "activity" ADD COLUMN "ex_course_id_json" text NOT NULL;--> statement-breakpoint
ALTER TABLE "eval_key" ADD CONSTRAINT "eval_key_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_ex_course_id_json_idx" ON "activity" USING btree ("ex_course_id_json");--> statement-breakpoint
CREATE INDEX "activity_ex_assignment_id_json_idx" ON "activity" USING btree ("ex_id_json");