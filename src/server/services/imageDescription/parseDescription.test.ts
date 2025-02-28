import { describe, expect, it } from "vitest";
import { beginStr, endStr, parseDescription } from "./parseDescription";

describe(parseDescription.name, () => {
  it("parses a properly formatted description", () => {
    const response = `Prefix${beginStr} This is a valid description ${endStr}Suffix`;
    const result = parseDescription(response);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.description).toBe("This is a valid description");
    }
  });

  it("fails if beginStr is missing", () => {
    const response = `Prefix This is a valid description ${endStr}Suffix`;
    const result = parseDescription(response);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toContain("code 1");
    }
  });

  it("fails if endStr is missing", () => {
    const response = `Prefix${beginStr} This is a valid description Suffix`;
    const result = parseDescription(response);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toContain("code 2");
    }
  });

  it("fails if multiple beginStr markers are present", () => {
    // This creates more than two parts from splitting by beginStr.
    const response = `Prefix${beginStr} First part ${beginStr} Second part ${endStr}Suffix`;
    const result = parseDescription(response);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toContain("code 1");
    }
  });

  it("fails if multiple endStr markers are present", () => {
    // This creates more than two parts from splitting by endStr.
    const response = `Prefix${beginStr} Valid description ${endStr} Extra ${endStr}Suffix`;
    const result = parseDescription(response);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toContain("code 2");
    }
  });

  it("fails if the description is empty after trimming", () => {
    const response = `Prefix${beginStr}     ${endStr}Suffix`;
    const result = parseDescription(response);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toContain("code 3");
    }
  });

  it("fails if response does not include beginStr at all", () => {
    const response = "Just some text without any marker";
    const result = parseDescription(response);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toContain("code 1");
    }
  });

  it("fails if response does not include endStr at all", () => {
    const response = `Prefix${beginStr} Valid description with no end marker`;
    const result = parseDescription(response);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toContain("code 2");
    }
  });

  it("handles no space before beginStr", () => {
    const response = `${beginStr}Valid description${endStr}Suffix`;
    const result = parseDescription(response);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.description).toBe("Valid description");
    }
  });

  it("handles no space before endStr", () => {
    const response = `Prefix${beginStr}Valid description${endStr}`;
    const result = parseDescription(response);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.description).toBe("Valid description");
    }
  });
});
