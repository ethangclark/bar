import { type Browser } from "playwright";
import {
  browsyBrowserHeight,
  browsyBrowserWidth,
  pageLoadedClassname,
} from "~/common/utils/constants";
import { getBaseUrl } from "~/common/utils/urlUtils";
import { withPageContext } from "~/server/executors/browser";
import { withPersistedPng } from "~/server/services/pngPersistor";

export async function annotateScreenshotRowCells({
  pngBuffer,
  timeoutMs,
  rowIdx,
  browser,
}: {
  pngBuffer: Buffer;
  timeoutMs: number;
  rowIdx: number;
  browser?: Browser;
}): Promise<{
  annotatedPngPieceBuffer: Buffer;
}> {
  return withPersistedPng(pngBuffer, async (pngUuid) => {
    const baseUrl = getBaseUrl();

    const annotatedScreenshotUrl = `${baseUrl}/annotatedScreenshotRowCells/${pngUuid}?rowIdx=${rowIdx}`;

    const result = await withPageContext(
      async ({ page }) => {
        await page.goto(annotatedScreenshotUrl);
        await page.waitForSelector(`.${pageLoadedClassname}`);
        const screenshot = await page.screenshot();
        // await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 15));
        return { annotatedPngPieceBuffer: screenshot };
      },
      {
        timeoutMs,
        browserDims: {
          width: browsyBrowserWidth,
          height: browsyBrowserHeight,
        },
        browser,
      },
    );

    console.log(
      "(cells) annotated screenshot row cells; URL:",
      annotatedScreenshotUrl,
    );

    return result;
  });
}
