CREATE TABLE "view_piece_video" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"view_piece_id" uuid NOT NULL,
	"info_video_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "view_piece_video" ADD CONSTRAINT "view_piece_video_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_piece_video" ADD CONSTRAINT "view_piece_video_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_piece_video" ADD CONSTRAINT "view_piece_video_view_piece_id_view_piece_id_fk" FOREIGN KEY ("view_piece_id") REFERENCES "public"."view_piece"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_piece_video" ADD CONSTRAINT "view_piece_video_info_video_id_info_video_id_fk" FOREIGN KEY ("info_video_id") REFERENCES "public"."info_video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "view_piece_video_activity_id_idx" ON "view_piece_video" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "view_piece_video_user_id_idx" ON "view_piece_video" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "view_piece_video_view_piece_id_idx" ON "view_piece_video" USING btree ("view_piece_id");--> statement-breakpoint
CREATE INDEX "view_piece_video_info_video_id_idx" ON "view_piece_video" USING btree ("info_video_id");