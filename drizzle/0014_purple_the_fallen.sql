ALTER TABLE "enriched_message_view_piece" RENAME TO "view_piece";--> statement-breakpoint
ALTER TABLE "view_piece" DROP CONSTRAINT "enriched_message_view_piece_message_id_message_id_fk";
--> statement-breakpoint
ALTER TABLE "view_piece_image" DROP CONSTRAINT "view_piece_image_view_piece_id_enriched_message_view_piece_id_fk";
--> statement-breakpoint
ALTER TABLE "view_piece_text" DROP CONSTRAINT "view_piece_text_view_piece_id_enriched_message_view_piece_id_fk";
--> statement-breakpoint
ALTER TABLE "view_piece" ADD COLUMN "activity_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "view_piece" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "view_piece_image" ADD COLUMN "activity_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "view_piece_image" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "view_piece_text" ADD COLUMN "activity_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "view_piece_text" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "view_piece" ADD CONSTRAINT "view_piece_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_piece" ADD CONSTRAINT "view_piece_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_piece" ADD CONSTRAINT "view_piece_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_piece_image" ADD CONSTRAINT "view_piece_image_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_piece_image" ADD CONSTRAINT "view_piece_image_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_piece_image" ADD CONSTRAINT "view_piece_image_view_piece_id_view_piece_id_fk" FOREIGN KEY ("view_piece_id") REFERENCES "public"."view_piece"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_piece_text" ADD CONSTRAINT "view_piece_text_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_piece_text" ADD CONSTRAINT "view_piece_text_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_piece_text" ADD CONSTRAINT "view_piece_text_view_piece_id_view_piece_id_fk" FOREIGN KEY ("view_piece_id") REFERENCES "public"."view_piece"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "view_piece_activity_id_idx" ON "view_piece" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "view_piece_user_id_idx" ON "view_piece" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "view_piece_message_id_idx" ON "view_piece" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "view_piece_image_activity_id_idx" ON "view_piece_image" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "view_piece_image_user_id_idx" ON "view_piece_image" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "view_piece_image_view_piece_id_idx" ON "view_piece_image" USING btree ("view_piece_id");--> statement-breakpoint
CREATE INDEX "view_piece_image_info_image_id_idx" ON "view_piece_image" USING btree ("info_image_id");--> statement-breakpoint
CREATE INDEX "view_piece_text_activity_id_idx" ON "view_piece_text" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "view_piece_text_user_id_idx" ON "view_piece_text" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "view_piece_text_view_piece_id_idx" ON "view_piece_text" USING btree ("view_piece_id");