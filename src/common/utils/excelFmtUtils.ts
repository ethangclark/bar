const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const excelFmtUtils = {
  rowIdxToExcelRow: (rowIdx: number) => rowIdx + 1,
  excelRowToRowIdx: (excelRow: number) => excelRow - 1,
  columnIdxToExcelColumn: (columnIdx: number) => {
    let result = "";
    let remaining = columnIdx;
    while (remaining >= 0) {
      result = alphabet[remaining % alphabet.length] + result;
      remaining = Math.floor(remaining / alphabet.length) - 1;
    }
    return result;
  },
  excelColumnToColumnIdx: (excelColumn: string) => {
    let result = 0;
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < excelColumn.length; i++) {
      result *= alphabet.length;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      result += alphabet.indexOf(excelColumn[i]!.toUpperCase()) + 1;
    }
    return result - 1;
  },
};
