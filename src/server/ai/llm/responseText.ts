import { type Result, failure } from "~/common/utils/result";
import { type OpenRouterResponse } from "./schemas";

export function getResponseText(response: OpenRouterResponse): Result<string> {
  if (!response.choices[0] || response.choices.length > 1) {
    return failure("Unexpected choices array in response.");
  }
  const content = response.choices[0].message.content;
  if (typeof content === "string") {
    return content;
  }
  const [c, ...excess] = content;
  if (!c || excess.length) {
    return failure("Unexpected content array in response.");
  }
  if ("text" in c) {
    return c.text;
  }
  return failure("Unexpected content type.");
}
