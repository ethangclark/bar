import { describe, it, expect } from "vitest";
import { html, text } from "./emailUtils";

describe("emailUtils", () => {
  describe("html function", () => {
    it("should return correct HTML with escaped email and URL", () => {
      const result = html({
        urlWithLoginToken: "http://example.com/token",
        email: "test@example.com",
      });
      expect(result).toContain("test@example&#8203;.com");
      expect(result).toContain("http://example.com/token");
    });
  });

  describe("text function", () => {
    it("should return correct text with email and URL", () => {
      const result = text({
        urlWithLoginToken: "http://example.com/token",
        email: "test@example.com",
      });
      expect(result).toBe(
        "Sign in to SummitEd.ai as test@example.com with this link: http://example.com/token\n\n",
      );
    });
  });
});
