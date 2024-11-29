import { describe, it, expect } from "vitest";
import { excelFmtUtils } from "./excelFmtUtils";

describe("excelFmtUtils", () => {
  describe("rowIdxToExcelRow", () => {
    it("should convert row index to Excel row number", () => {
      expect(excelFmtUtils.rowIdxToExcelRow(0)).toBe(1);
      expect(excelFmtUtils.rowIdxToExcelRow(9)).toBe(10);
      expect(excelFmtUtils.rowIdxToExcelRow(99)).toBe(100);
    });
  });

  describe("excelRowToRowIdx", () => {
    it("should convert Excel row number to row index", () => {
      expect(excelFmtUtils.excelRowToRowIdx(1)).toBe(0);
      expect(excelFmtUtils.excelRowToRowIdx(10)).toBe(9);
      expect(excelFmtUtils.excelRowToRowIdx(100)).toBe(99);
    });
  });

  describe("columnIdxToExcelColumn", () => {
    it("should convert column index to Excel column letter", () => {
      expect(excelFmtUtils.columnIdxToExcelColumn(0)).toBe("A");
      expect(excelFmtUtils.columnIdxToExcelColumn(25)).toBe("Z");
      expect(excelFmtUtils.columnIdxToExcelColumn(26)).toBe("AA");
      expect(excelFmtUtils.columnIdxToExcelColumn(51)).toBe("AZ");
      expect(excelFmtUtils.columnIdxToExcelColumn(701)).toBe("ZZ");
      expect(excelFmtUtils.columnIdxToExcelColumn(702)).toBe("AAA");
    });
  });

  describe("excelColumnToColumnIdx", () => {
    it("should convert Excel column letter to column index", () => {
      expect(excelFmtUtils.excelColumnToColumnIdx("A")).toBe(0);
      expect(excelFmtUtils.excelColumnToColumnIdx("Z")).toBe(25);
      expect(excelFmtUtils.excelColumnToColumnIdx("AA")).toBe(26);
      expect(excelFmtUtils.excelColumnToColumnIdx("AZ")).toBe(51);
      expect(excelFmtUtils.excelColumnToColumnIdx("ZZ")).toBe(701);
      expect(excelFmtUtils.excelColumnToColumnIdx("AAA")).toBe(702);
    });

    it("should be case-insensitive", () => {
      expect(excelFmtUtils.excelColumnToColumnIdx("a")).toBe(0);
      expect(excelFmtUtils.excelColumnToColumnIdx("aa")).toBe(26);
      expect(excelFmtUtils.excelColumnToColumnIdx("aAa")).toBe(702);
    });
  });
});
