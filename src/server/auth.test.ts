import { describe, it, expect, vi, beforeEach } from "vitest";
import { html, text } from "~/server/auth";
import { authOptions } from "~/server/auth";

vi.mock("nodemailer");
vi.mock("~/env");
vi.mock("~/server/db/index");
vi.mock("~/server/runner/opLogger");
vi.mock("~/server/db");

describe("auth", () => {
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

  describe("authOptions", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("should have Email provider configured", () => {
      expect(authOptions.providers).toHaveLength(1);
      expect(authOptions.providers[0]?.id).toBe("email");
    });
  });
});
