ALTER TABLE "ad_hoc_activities" RENAME TO "standalone_activities";--> statement-breakpoint
ALTER TABLE "student_activities" RENAME TO "standalone_enrollments";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "requested_ad_hoc_instructor_access" TO "requested_instructor_access";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "is_ad_hoc_instructor" TO "is_instructor";--> statement-breakpoint
ALTER TABLE "standalone_activities" DROP CONSTRAINT "ad_hoc_activities_activity_id_unique";--> statement-breakpoint
ALTER TABLE "standalone_activities" DROP CONSTRAINT "ad_hoc_activities_activity_id_activity_id_fk";
--> statement-breakpoint
ALTER TABLE "standalone_activities" DROP CONSTRAINT "ad_hoc_activities_creator_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "standalone_enrollments" DROP CONSTRAINT "student_activities_activity_id_activity_id_fk";
--> statement-breakpoint
ALTER TABLE "standalone_enrollments" DROP CONSTRAINT "student_activities_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "ad_hoc_activities_creator_id_idx";--> statement-breakpoint
DROP INDEX "student_activities_unique_pair_idx";--> statement-breakpoint
DROP INDEX "student_activities_activity_id_idx";--> statement-breakpoint
DROP INDEX "student_activities_user_id_idx";--> statement-breakpoint
ALTER TABLE "standalone_activities" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "standalone_enrollments" ADD COLUMN "standalone_activity_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "standalone_activities" ADD CONSTRAINT "standalone_activities_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standalone_activities" ADD CONSTRAINT "standalone_activities_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standalone_enrollments" ADD CONSTRAINT "standalone_enrollments_standalone_activity_id_standalone_activities_id_fk" FOREIGN KEY ("standalone_activity_id") REFERENCES "public"."standalone_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standalone_enrollments" ADD CONSTRAINT "standalone_enrollments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "standalone_activities_activity_id_idx" ON "standalone_activities" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "standalone_activities_creator_id_idx" ON "standalone_activities" USING btree ("creator_id");--> statement-breakpoint
CREATE UNIQUE INDEX "standalone_enrollments_unique_pair_idx" ON "standalone_enrollments" USING btree ("standalone_activity_id","user_id");--> statement-breakpoint
CREATE INDEX "standalone_enrollments_standalone_activity_id_idx" ON "standalone_enrollments" USING btree ("standalone_activity_id");--> statement-breakpoint
CREATE INDEX "standalone_enrollments_user_id_idx" ON "standalone_enrollments" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "standalone_enrollments" DROP COLUMN "activity_id";--> statement-breakpoint
ALTER TABLE "standalone_activities" ADD CONSTRAINT "standalone_activities_activity_id_unique" UNIQUE("activity_id");