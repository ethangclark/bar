import { type OpenRouterResponse } from "./schemas";

export function getResponseText(response: OpenRouterResponse): string | Error {
  if (!response.choices[0] || response.choices.length > 1) {
    return new Error("Unexpected choices array in response.");
  }
  const content = response.choices[0].message.content;
  if (typeof content === "string") {
    return content;
  }
  const [c, ...excess] = content;
  if (!c || excess.length) {
    return new Error("Unexpected content array in response.");
  }
  if ("text" in c) {
    return c.text;
  }
  return new Error("Unexpected content type.");
}
