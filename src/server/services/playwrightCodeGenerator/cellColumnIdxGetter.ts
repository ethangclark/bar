import { isFailure, type Result } from "~/common/utils/result";
import { testLogPng } from "~/server/testLog";
import { getClickCellColumnIdx } from "./getPieceRowAndColumn";
import { annotateScreenshotRowCells } from "./screenshotRowCellsAnnotator";
import { type Browser } from "playwright";

export async function getCellColumnIdx({
  naturalLanguageCommand,
  screenshotPngBuffer,
  userId,
  timeoutMs,
  rowIdx,
  browser,
}: {
  naturalLanguageCommand: string;
  screenshotPngBuffer: Buffer;
  userId: string;
  timeoutMs: number;
  rowIdx: number;
  browser?: Browser;
}): Promise<Result<{ columnIdx: number }>> {
  const annotatedScreenshotRowCells = await annotateScreenshotRowCells({
    pngBuffer: screenshotPngBuffer,
    rowIdx,
    timeoutMs,
    browser,
  });

  testLogPng(
    "annotatedScreenshotRowCells",
    annotatedScreenshotRowCells.annotatedPngPieceBuffer,
  );

  const columnResult = await getClickCellColumnIdx({
    userId,
    naturalLanguageCommand,
    annotatedPngBuffer: annotatedScreenshotRowCells.annotatedPngPieceBuffer,
  });
  if (isFailure(columnResult)) {
    return columnResult;
  }
  const { columnIdx } = columnResult;

  return { columnIdx };
}
