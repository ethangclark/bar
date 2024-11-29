import { GoogleGenerativeAI } from "@google/generative-ai";

import "../llmNotTestAsserter"; // so we can disable this for prompt tests

// TODO: move this and other API keys into ~/env
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const google = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
