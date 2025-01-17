CREATE TYPE "public"."integration_type" AS ENUM('canvas');--> statement-breakpoint
CREATE TYPE "public"."sender_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TABLE "account" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"ex_id_json" text NOT NULL,
	"integration_id" uuid
);
--> statement-breakpoint
CREATE TABLE "activity_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"order_frac_idx" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "canvas_integration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_id" uuid NOT NULL,
	"canvas_base_url" text NOT NULL,
	"client_id" text NOT NULL,
	"client_secret" text NOT NULL,
	"validated" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "canvas_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"canvas_global_id" text NOT NULL,
	"non_global_ids_arr_json" text NOT NULL,
	"canvas_user_name" text NOT NULL,
	"oauth_refresh_token" text NOT NULL,
	"access_token_lifespan_ms" integer,
	"canvas_integration_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "info_block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_item_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "integration_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ip_user" (
	"ip_address" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_role" "sender_role" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "question" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_item_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activity_item_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"integration_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_item" ADD CONSTRAINT "activity_item_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canvas_integration" ADD CONSTRAINT "canvas_integration_integration_id_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canvas_user" ADD CONSTRAINT "canvas_user_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canvas_user" ADD CONSTRAINT "canvas_user_canvas_integration_id_canvas_integration_id_fk" FOREIGN KEY ("canvas_integration_id") REFERENCES "public"."canvas_integration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "info_block" ADD CONSTRAINT "info_block_activity_item_id_activity_item_id_fk" FOREIGN KEY ("activity_item_id") REFERENCES "public"."activity_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_user" ADD CONSTRAINT "ip_user_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_thread_id_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_activity_item_id_activity_id_fk" FOREIGN KEY ("activity_item_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_activity_item_id_activity_item_id_fk" FOREIGN KEY ("activity_item_id") REFERENCES "public"."activity_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_integrations" ADD CONSTRAINT "user_integrations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_integrations" ADD CONSTRAINT "user_integrations_integration_id_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_due_at_idx" ON "activity" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "activity_int_id_idx" ON "activity" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "activity_item_activity_id_idx" ON "activity_item" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "canvas_int_int_id_idx" ON "canvas_integration" USING btree ("integration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "canvas_int_base_url_idx" ON "canvas_integration" USING btree ("canvas_base_url");--> statement-breakpoint
CREATE INDEX "canvas_user_user_id_idx" ON "canvas_user" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "canvas_user_canvas_global_id_idx" ON "canvas_user" USING btree ("canvas_global_id");--> statement-breakpoint
CREATE INDEX "canvas_user_canvas_integration_id_idx" ON "canvas_user" USING btree ("canvas_integration_id");--> statement-breakpoint
CREATE INDEX "info_block_activity_item_id_idx" ON "info_block" USING btree ("activity_item_id");--> statement-breakpoint
CREATE INDEX "ip_user_user_id_idx" ON "ip_user" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "message_user_id_idx" ON "message" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "message_thread_id_idx" ON "message" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "post_created_by_id_idx" ON "post" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "post_name_idx" ON "post" USING btree ("name");--> statement-breakpoint
CREATE INDEX "question_activity_item_id_idx" ON "question" USING btree ("activity_item_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");