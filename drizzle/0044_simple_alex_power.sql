ALTER TABLE "user" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;
UPDATE "user" SET "is_admin" = true WHERE "email" = 'ethangclark@gmail.com';
