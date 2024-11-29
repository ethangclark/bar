import { columnWidth, rowHeight } from "~/common/utils/constants";
import { isFailure, type Result } from "~/common/utils/result";
import { testLogPng } from "~/server/testLog";
import { getCellColumnIdx } from "./cellColumnIdxGetter";
import { getRowIdx } from "./rowIdxGetter";
import { annotateScreenshotCursor } from "./screenshotCursorAnnotator";
import { annotateScreenshotZoom } from "./screenshotZoomAnnotator";
import { type Browser } from "playwright";

export async function getBrowserClickCoords({
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
}): Promise<Result<{ xCoord: number; yCoord: number }>> {
  const rowIdxResult = await getRowIdx({
    naturalLanguageCommand,
    screenshotPngBuffer,
    userId,
    timeoutMs,
    browser,
  });
  if (isFailure(rowIdxResult)) {
    return rowIdxResult;
  }
  const { rowIdx } = rowIdxResult;

  const cellColumnIdxResult = await getCellColumnIdx({
    naturalLanguageCommand,
    screenshotPngBuffer,
    userId,
    timeoutMs,
    rowIdx,
    browser,
  });
  if (isFailure(cellColumnIdxResult)) {
    return cellColumnIdxResult;
  }
  const { columnIdx } = cellColumnIdxResult;

  const annotatedScreenshotCursor = await annotateScreenshotCursor({
    pngBuffer: screenshotPngBuffer,
    rowIdx,
    columnIdx,
    timeoutMs,
    browser,
  });
  testLogPng(
    "annotatedScreenshotCursor",
    annotatedScreenshotCursor.annotatedCursorBuffer,
  );

  const annotatedScreenshotZoomedCursor = await annotateScreenshotZoom({
    pngBuffer: annotatedScreenshotCursor.annotatedCursorBuffer,
    rowIdx,
    columnIdx,
    timeoutMs,
    browser,
  });
  testLogPng(
    "annotatedScreenshotZoomedCursor",
    annotatedScreenshotZoomedCursor.annotatedZoomBuffer,
  );

  // const zoomedCursorResult = await getZoomedCursorClickPosition({
  //   userId,
  //   naturalLanguageCommand,
  //   annotatedPngBuffer: annotatedScreenshotZoomedCursor.annotatedZoomBuffer,
  //   browser,
  // });
  // if (isFailure(zoomedCursorResult)) {
  //   return zoomedCursorResult;
  // }

  // if (zoomedCursorResult.offset === null) {
  //   return failure("Cursor position not supported.");
  // }

  const xCoord = (columnIdx + 0.5) * columnWidth;
  const yCoord = (rowIdx + 0.5) * rowHeight;
  // xCoord += zoomedCursorResult.offset.x;
  // yCoord += zoomedCursorResult.offset.y;

  return { xCoord, yCoord };
}
