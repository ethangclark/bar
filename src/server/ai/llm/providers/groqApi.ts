import Groq from "groq-sdk";
import { env } from "~/env";

import "../llmNotTestAsserter"; // so we can disable this for prompt tests

export const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});
