import { round } from "./numberUtils";

describe("round", () => {
  it("should round a number to the specified number of decimal places", () => {
    expect(round(1.2345, 2)).toBe(1.23);
    expect(round(1.2355, 2)).toBe(1.24);
    expect(round(1.2345, 3)).toBe(1.235);
  });

  it("should handle rounding to zero decimal places", () => {
    expect(round(1.5, 0)).toBe(2);
    expect(round(1.4, 0)).toBe(1);
  });

  it("should handle negative numbers correctly", () => {
    expect(round(-1.2345, 2)).toBe(-1.23);
    expect(round(-1.2355, 2)).toBe(-1.24);
  });

  it("should handle zero correctly", () => {
    expect(round(0, 2)).toBe(0);
  });

  it("should handle large numbers correctly", () => {
    expect(round(12345.6789, 2)).toBe(12345.68);
    expect(round(12345.6789, 0)).toBe(12346);
  });

  it("should handle rounding to more decimal places than the number has", () => {
    expect(round(1.2, 3)).toBe(1.2);
    expect(round(1.2, 5)).toBe(1.2);
  });
});
