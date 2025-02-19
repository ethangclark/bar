CREATE TABLE "ad_hoc_activities" (
	"activity_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"title" text NOT NULL,
	CONSTRAINT "ad_hoc_activities_activity_id_unique" UNIQUE("activity_id")
);
--> statement-breakpoint
CREATE TABLE "integration_activities" (
	"integration_id" uuid NOT NULL,
	"activity_id" uuid NOT NULL,
	"ex_course_id_json" text NOT NULL,
	"ex_assignment_id_json" text NOT NULL,
	CONSTRAINT "integration_activities_integration_id_activity_id_pk" PRIMARY KEY("integration_id","activity_id"),
	CONSTRAINT "integration_activities_activity_id_unique" UNIQUE("activity_id")
);
--> statement-breakpoint
ALTER TABLE "activity" DROP CONSTRAINT "activity_integration_id_integration_id_fk";
--> statement-breakpoint
DROP INDEX "activity_ex_course_id_json_idx";--> statement-breakpoint
DROP INDEX "activity_ex_assignment_id_json_idx";--> statement-breakpoint
DROP INDEX "activity_integration_id_idx";--> statement-breakpoint
ALTER TABLE "ad_hoc_activities" ADD CONSTRAINT "ad_hoc_activities_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_hoc_activities" ADD CONSTRAINT "ad_hoc_activities_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_activities" ADD CONSTRAINT "integration_activities_integration_id_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_activities" ADD CONSTRAINT "integration_activities_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ad_hoc_activities_creator_id_idx" ON "ad_hoc_activities" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "integration_activities_ex_course_id_json_idx" ON "integration_activities" USING btree ("ex_course_id_json");--> statement-breakpoint
CREATE INDEX "integration_activities_ex_assignment_id_json_idx" ON "integration_activities" USING btree ("ex_assignment_id_json");--> statement-breakpoint
ALTER TABLE "activity" DROP COLUMN "ex_course_id_json";--> statement-breakpoint
ALTER TABLE "activity" DROP COLUMN "ex_assignment_id_json";--> statement-breakpoint
ALTER TABLE "activity" DROP COLUMN "integration_id";