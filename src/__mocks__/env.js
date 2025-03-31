/* eslint-disable @typescript-eslint/ban-ts-comment */
const defaultProcessEnv = { TEST_TYPE: undefined };
const processEnv =
  typeof process === "undefined"
    ? defaultProcessEnv
    : process.env ?? defaultProcessEnv;

const promptTestEnv = {
  NODE_ENV: "test",
  TEST_TYPE: "prompt_test",
  // @ts-ignore
  PORT: processEnv.PORT,
  // @ts-ignore
  DATABASE_URL: processEnv.DATABASE_URL,
  // @ts-ignore
  OPENAI_API_KEY: processEnv.OPENAI_API_KEY,
  // @ts-ignore
  GROQ_API_KEY: processEnv.GROQ_API_KEY,
  // @ts-ignore
  OPENROUTER_API_KEY: processEnv.OPENROUTER_API_KEY,
};

// @ts-ignore
const isPromptTest = processEnv.TEST_TYPE === "prompt_test";

export const env = isPromptTest ? promptTestEnv : { NODE_ENV: "test" };

export function assertIsNotTest() {
  if (env.NODE_ENV === "test") {
    throw new Error("This function should not be called in test environment");
  }
}
