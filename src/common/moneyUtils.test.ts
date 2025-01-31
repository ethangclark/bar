import { formatMoney } from "./moneyUtils";

// Mock the language import
vi.mock("./languageUtils", () => ({
  language: "en-US",
}));

describe("formatMoney", () => {
  it("should format positive amounts correctly", () => {
    expect(formatMoney(1234.56)).toBe("$1,234.56");
  });

  it("should format negative amounts correctly", () => {
    expect(formatMoney(-1234.56)).toBe("-$1,234.56");
  });

  it("should format zero amount correctly", () => {
    expect(formatMoney(0)).toBe("$0.00");
  });

  it("should handle small positive amounts correctly", () => {
    expect(formatMoney(0.004)).toBe("$0.00");
    expect(formatMoney(0.005)).toBe("$0.01");
  });

  it("should handle small negative amounts correctly", () => {
    expect(formatMoney(-0.004)).toBe("-$0.00");
    expect(formatMoney(-0.005)).toBe("-$0.01");
  });

  it("should handle rounding for positive amounts", () => {
    expect(formatMoney(0.1234)).toBe("$0.12");
    expect(formatMoney(0.5678)).toBe("$0.57");
  });

  it("should handle rounding for negative amounts", () => {
    expect(formatMoney(-0.1234)).toBe("-$0.12");
    expect(formatMoney(-0.5678)).toBe("-$0.57");
  });

  it("should format edge cases for zero correctly", () => {
    expect(formatMoney(-0.0001)).toBe("$0.00");
    expect(formatMoney(0.0001)).toBe("$0.00");
  });
});
