CREATE TABLE IF NOT EXISTS "drizzle_account" (
	"userId" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "drizzle_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_ipUser" (
	"ipAddress" varchar(255) PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_png" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asUrl" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_post" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256),
	"createdById" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp with time zone DEFAULT now(),
	"tokensUsed" integer DEFAULT 0 NOT NULL,
	"image" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle_verificationToken" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "drizzle_verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_account" ADD CONSTRAINT "drizzle_account_userId_drizzle_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."drizzle_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_ipUser" ADD CONSTRAINT "drizzle_ipUser_userId_drizzle_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."drizzle_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_post" ADD CONSTRAINT "drizzle_post_createdById_drizzle_user_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."drizzle_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drizzle_session" ADD CONSTRAINT "drizzle_session_userId_drizzle_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."drizzle_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "drizzle_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ipUser_userId_idx" ON "drizzle_ipUser" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "createdById_idx" ON "drizzle_post" USING btree ("createdById");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name_idx" ON "drizzle_post" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "drizzle_session" USING btree ("userId");