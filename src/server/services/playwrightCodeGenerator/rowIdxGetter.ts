import { isFailure, type Result } from "~/common/utils/result";
import { testLogPng } from "~/server/testLog";
import { getClickRowIdx } from "./getClickRowIdx";
import { annotateScreenshotRows } from "./screenshotRowAnnotator";
import { type Browser } from "playwright";

export async function getRowIdx({
  naturalLanguageCommand,
  screenshotPngBuffer,
  userId,
  timeoutMs,
  browser,
}: {
  naturalLanguageCommand: string;
  screenshotPngBuffer: Buffer;
  userId: string;
  timeoutMs: number;
  browser?: Browser;
}): Promise<Result<{ rowIdx: number }>> {
  const annotatedScreenshotRows = await annotateScreenshotRows({
    pngBuffer: screenshotPngBuffer,
    timeoutMs,
    browser,
  });

  testLogPng("screenshot", screenshotPngBuffer);
  testLogPng(
    "annotatedScreenshotRows",
    annotatedScreenshotRows.annotatedPngBuffer,
  );

  const rowIdxResult = await getClickRowIdx({
    userId,
    naturalLanguageCommand,
    annotatedPngBuffer: annotatedScreenshotRows.annotatedPngBuffer,
  });
  if (isFailure(rowIdxResult)) {
    return rowIdxResult;
  }

  const { rowIdx } = rowIdxResult;

  return { rowIdx };
}
