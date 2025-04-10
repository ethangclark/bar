import { createEnv } from "@t3-oss/env-nextjs";
import "dotenv/config";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    HOST_NAME: z.string(),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    TEST_TYPE: z.enum(["prompt_test"]).optional(),
    EMAIL_SERVER: z.string().url(),
    EMAIL_FROM: z.string().email(),
    OPENAI_API_KEY: z.string(),
    HEADFUL: z.boolean(),
    OPENROUTER_API_KEY: z.string(),
    PORT: z.string().default("3000"),
    QUICK_DEV_LOGIN: z.literal("true").optional(),
    CLOUDFLARE_ACCOUNT_ID: z.string(),
    CLOUDFLARE_API_TOKEN: z.string(),
    CLOUDFLARE_STREAM_KEY_ID: z.string(),
    CLOUDFLARE_STREAM_PEM_BASE64: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    HOST_NAME: process.env.HOST_NAME,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    TEST_TYPE: process.env.TEST_TYPE,
    EMAIL_SERVER: process.env.EMAIL_SERVER,
    EMAIL_FROM: process.env.EMAIL_FROM,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    HEADFUL: process.env.HEADFUL === "true",
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    PORT: process.env.PORT,
    QUICK_DEV_LOGIN: process.env.QUICK_DEV_LOGIN,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_STREAM_KEY_ID: process.env.CLOUDFLARE_STREAM_KEY_ID,
    CLOUDFLARE_STREAM_PEM_BASE64: process.env.CLOUDFLARE_STREAM_PEM_BASE64,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});

export function assertIsNotTest() {
  if (env.NODE_ENV === "test") {
    throw new Error("This code should not be run in a test environment");
  }
}

assertIsNotTest();
