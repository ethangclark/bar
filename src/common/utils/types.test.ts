import { isSentence, type Sentence } from "./types";

describe("isSentence", () => {
  it("should return true for a valid sentence", () => {
    const validSentence: Sentence = "This is a sentence.";
    expect(isSentence(validSentence)).toBe(true);
  });

  it("should return false for a string that does not end with a period", () => {
    const invalidSentence = "This is not a sentence";
    expect(isSentence(invalidSentence)).toBe(false);
  });

  it("should return false for a non-string value", () => {
    const nonStringValue = 12345;
    expect(isSentence(nonStringValue)).toBe(false);
  });
});
