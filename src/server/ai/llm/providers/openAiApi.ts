import OpenAI from "openai";

import "../llmNotTestAsserter"; // so we can disable this for prompt tests

export const openai = new OpenAI();
