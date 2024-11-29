import Anthropic from "@anthropic-ai/sdk";

import "../llmNotTestAsserter"; // so we can disable this for prompt tests

export const anthropic = new Anthropic();

// Maybe TODO??
// export const anthropic = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
// });
