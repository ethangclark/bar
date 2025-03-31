import { extractFlagReason } from "./extractFlagReason";

// Since extractFlagReason is not exported in the original file,
// you'll need to export it or move this test logic to where it can access the function

describe("extractFlagReason", () => {
  it("returns null when <no-flags> is present", () => {
    const llmResponse = "This response contains <no-flags></no-flags>";
    const result = extractFlagReason({ llmResponse });
    expect(result).toBeNull();
  });

  it("extracts flag reason correctly", () => {
    const reason = "User mentioned harmful content";
    const llmResponse = `Some text before <flag-reason>${reason}</flag-reason> some text after`;
    const result = extractFlagReason({ llmResponse });
    expect(result).toBe(reason);
  });

  it("returns null when no flag reason is found", () => {
    const llmResponse = "This response contains no flag reason tags";
    const result = extractFlagReason({ llmResponse });
    expect(result).toBeNull();
  });

  it("throws error when multiple flag reasons are found", () => {
    const llmResponse =
      "<flag-reason>First reason</flag-reason> <flag-reason>Second reason</flag-reason>";
    expect(() => extractFlagReason({ llmResponse })).toThrow(
      "Multiple flag reasons found in LLM response",
    );
  });

  it("trims whitespace from extracted reason", () => {
    const llmResponse = "<flag-reason>  Reason with whitespace  </flag-reason>";
    const result = extractFlagReason({ llmResponse });
    expect(result).toBe("Reason with whitespace");
  });
});
