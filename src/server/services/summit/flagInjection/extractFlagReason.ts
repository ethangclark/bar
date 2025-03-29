export function extractFlagReason({ llmResponse }: { llmResponse: string }) {
  if (llmResponse.includes("<no-flags>")) {
    return null;
  }

  // Extract item IDs from <item-completed> tags
  const flagReasonRegex = /<flag-reason>(.*?)<\/flag-reason>/g;

  const matches = llmResponse.match(flagReasonRegex);

  if (!matches || matches.length === 0) {
    return null;
  }

  if (matches.length > 1) {
    throw new Error("Multiple flag reasons found in LLM response");
  }

  const match = flagReasonRegex.exec(llmResponse);
  if (!match || typeof match[1] !== "string") {
    throw new Error("Invalid match");
  }

  return match[1].trim();
}
