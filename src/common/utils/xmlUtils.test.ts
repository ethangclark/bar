import { isFailure } from "./result";
import {
  allTagContents,
  oneOrNoneTagContents,
  oneTagContent,
} from "./xmlUtils";

describe("XML Tag Content Functions", () => {
  describe("allTagContents", () => {
    it("should return all contents between the given tags", () => {
      const xml = "<tag>content1</tag><tag>content2</tag>";
      const result = allTagContents({ tag: "tag", xml });
      expect(result).toEqual(["content1", "content2"]);
    });

    it("should return an empty array if nested tags are found", () => {
      const xml = "<tag><tag>content</tag></tag>";
      const result = allTagContents({ tag: "tag", xml });
      expect(result).toEqual([]);
    });

    it("should return an empty array for self-closing tags", () => {
      const xml = "<tag></tag>";
      const result = allTagContents({ tag: "tag", xml });
      expect(result).toEqual([""]);
    });

    it("should trim content", () => {
      const xml = "<tag> content </tag>";
      const result = allTagContents({ tag: "tag", xml });
      expect(result).toEqual(["content"]);
    });
  });

  describe("oneOrNoneTagContents", () => {
    it("should return the content if there is one tag", () => {
      const xml = "<tag>content</tag>";
      const result = oneOrNoneTagContents({ tag: "tag", xml });
      expect(result).toEqual("content");
    });

    it("should return null if there are no tags", () => {
      const xml = "<root></root>";
      const result = oneOrNoneTagContents({ tag: "tag", xml });
      expect(result).toBeNull();
    });

    it("should return a failure if there are more than one tags", () => {
      const xml = "<tag>content1</tag><tag>content2</tag>";
      const result = oneOrNoneTagContents({ tag: "tag", xml });
      expect(result).toEqual({
        error: isFailure(result) ? result.error : null,
        problem: "Found 2 matches; expected 1 or 0.",
        type: "badXml",
        data: { xml, tag: "tag" },
      });
    });
    it("should return an empty array when there are no matches", () => {
      expect(allTagContents({ tag: "foo", xml: "" })).toEqual([]);
    });
    it("should return an array of matches when there are matches", () => {
      expect(allTagContents({ tag: "foo", xml: "<foo>bar</foo>" })).toEqual([
        "bar",
      ]);
    });
    it("should return an array of matches when there are multiple matches", () => {
      expect(
        allTagContents({
          tag: "foo",
          xml: "<foo>bar</foo><foo>baz</foo>",
        }),
      ).toEqual(["bar", "baz"]);
    });
    it("should return an array of empty strings when there are empty tags", () => {
      expect(
        allTagContents({
          tag: "foo",
          xml: "<foo></foo>",
        }),
      ).toEqual([""]);
    });
    it("should return an array of empty strings when there are multiple empty tags", () => {
      expect(
        allTagContents({
          tag: "foo",
          xml: "<foo></foo><foo></foo>",
        }),
      ).toEqual(["", ""]);
    });
    it("should return an array of matches (minus the whitespace) when there are matches with whitespace", () => {
      expect(
        allTagContents({
          tag: "foo",
          xml: "<foo>  bar  </foo>",
        }),
      ).toEqual(["bar"]);
    });
    it("should return an array of matches when there are multiple matches with whitespace", () => {
      expect(
        allTagContents({
          tag: "foo",
          xml: "<foo>  bar  </foo><foo>  baz  </foo>",
        }),
      ).toEqual(["bar", "baz"]);
    });
    it("should return an array of empty strings when there are empty tags with whitespace", () => {
      expect(
        allTagContents({
          tag: "foo",
          xml: "<foo>  </foo>",
        }),
      ).toEqual([""]);
    });
    it("should return an array of empty strings when there are multiple empty tags with whitespace", () => {
      expect(
        allTagContents({
          tag: "foo",
          xml: "<foo>  </foo><foo>  </foo>",
        }),
      ).toEqual(["", ""]);
    });
    it("should return an array of matches when there are matches with newlines", () => {
      expect(
        allTagContents({
          tag: "foo",
          xml: "<foo>\nbar\n</foo>",
        }),
      ).toEqual(["bar"]);
    });
    it("should return an array of matches when there are multiple matches with newlines", () => {
      expect(
        allTagContents({
          tag: "foo",
          xml: "<foo>\nbar\n</foo><foo>\nbaz\n</foo>",
        }),
      ).toEqual(["bar", "baz"]);
    });
    it("should return an array of empty strings when there are empty tags with newlines", () => {
      expect(
        allTagContents({
          tag: "foo",
          xml: "<foo>\n</foo>",
        }),
      ).toEqual([""]);
    });
    it("should return an array of empty strings when there are multiple empty tags with newlines", () => {
      expect(
        allTagContents({
          tag: "foo",
          xml: "<foo>\n</foo><foo>\n</foo>",
        }),
      ).toEqual(["", ""]);
    });
    it("should return an empty array when the number of start tags does not match the number of end tags", () => {
      expect(
        allTagContents({
          tag: "foo",
          xml: "<foo>asdf<foo>bar</foo>",
        }),
      ).toEqual([]);
    });
  });

  describe("oneTagContent", () => {
    it("should return the content if there is exactly one tag", () => {
      const xml = "<tag>content</tag>";
      const result = oneTagContent({ tag: "tag", xml });
      expect(result).toEqual("content");
    });

    it("should return a failure if there are no tags", () => {
      const xml = "<root></root>";
      const result = oneTagContent({ tag: "tag", xml });
      expect(result).toEqual({
        error: isFailure(result) ? result.error : null,
        problem: "Found 0 matches; expected 1.",
        type: "badXml",
        data: { xml, tag: "tag" },
      });
    });

    it("should return a failure if there are more than one tags", () => {
      const xml = "<tag>content1</tag><tag>content2</tag>";
      const result = oneTagContent({ tag: "tag", xml });
      expect(result).toEqual({
        error: isFailure(result) ? result.error : null,
        problem: "Found 2 matches; expected 1.",
        type: "badXml",
        data: { xml, tag: "tag" },
      });
    });
  });
});
