import { describe, expect, it } from "vitest";
import { loginEmailHtml, loginEmailText } from "./setPasswordEmailUtils";

describe("emailUtils", () => {
  describe("html function", () => {
    it("should return correct HTML with escaped email and URL", () => {
      const result = loginEmailHtml({
        urlWithSetPasswordToken: "http://example.com/token",
        email: "test@example.com",
      });
      expect(result).toContain("test@example&#8203;.com");
      expect(result).toContain("http://example.com/token");
    });
  });

  describe("text function", () => {
    it("should return correct text with email and URL", () => {
      const result = loginEmailText({
        urlWithSetPasswordToken: "http://example.com/token",
        email: "test@example.com",
      });
      expect(result).toBe(
        "Sign in to SummitEd as test@example.com with this link: http://example.com/token\n\n",
      );
    });
  });
});
