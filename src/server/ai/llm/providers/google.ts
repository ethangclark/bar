import { errorToFailure, failure, type Result } from "~/common/utils/result";
import { google } from "./googleApi";
import { type LlmResponse, type LlmParams } from "../schemas";

export async function getResponseFromGoogle(
  params: LlmParams,
): Promise<Result<LlmResponse>> {
  const model = google.getGenerativeModel({ model: "gemini-1.5-pro-exp-0827" });

  const { systemPrompt, messages, maxTokens } = params;

  try {
    const result = await model.generateContent({
      contents: [
        ...(systemPrompt
          ? [{ role: "user", parts: [{ text: systemPrompt }] }]
          : []),
        {
          role: "user",
          parts: messages.map((msg) => {
            switch (msg.type) {
              case "text":
                return { text: msg.content };
              case "png":
                return {
                  inlineData: {
                    data: msg.content.toString("base64"),
                    mimeType: "image/png",
                  },
                };
            }
          }),
        },
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
      },
    });

    const response = result.response;
    const text = response.text();

    if (!text) {
      return failure("No message in completion from Google AI.");
    }

    // Note: Google's API doesn't provide token usage information in the same way
    // We're using placeholder values here. Could do some fancy estimates if we wanted to.
    return {
      response: text,
      tokensUsed: 0, // Placeholder
      promptTokens: 0, // Placeholder
      completionTokens: 0, // Placeholder
    };
  } catch (error) {
    return errorToFailure(error, "Error calling Google AI API");
  }
}
