CREATE TABLE "student_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_activities" ADD CONSTRAINT "student_activities_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_activities" ADD CONSTRAINT "student_activities_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "student_activities_unique_pair_idx" ON "student_activities" USING btree ("activity_id","user_id");--> statement-breakpoint
CREATE INDEX "student_activities_activity_id_idx" ON "student_activities" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "student_activities_user_id_idx" ON "student_activities" USING btree ("user_id");