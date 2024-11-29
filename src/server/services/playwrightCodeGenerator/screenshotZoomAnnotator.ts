import { type Browser } from "playwright";
import {
  browsyBrowserHeight,
  browsyBrowserWidth,
  pageLoadedClassname,
} from "~/common/utils/constants";
import { getBaseUrl } from "~/common/utils/urlUtils";
import { withPageContext } from "~/server/executors/browser";
import { withPersistedPng } from "~/server/services/pngPersistor";

export async function annotateScreenshotZoom({
  pngBuffer,
  timeoutMs,
  rowIdx,
  columnIdx,
  browser,
}: {
  pngBuffer: Buffer;
  timeoutMs: number;
  rowIdx: number;
  columnIdx: number;
  browser?: Browser;
}): Promise<{
  annotatedZoomBuffer: Buffer;
}> {
  return withPersistedPng(pngBuffer, async (pngUuid) => {
    const baseUrl = getBaseUrl();

    const annotatedScreenshotUrl = `${baseUrl}/annotatedScreenshotZoom/${pngUuid}?rowIdx=${rowIdx}&columnIdx=${columnIdx}`;

    const result = await withPageContext(
      async ({ page }) => {
        await page.goto(annotatedScreenshotUrl);
        await page.waitForSelector(`.${pageLoadedClassname}`);
        const screenshot = await page.screenshot();
        return { annotatedZoomBuffer: screenshot };
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
      "(zoom) annotated screenshot zoom URL:",
      annotatedScreenshotUrl,
    );

    return result;
  });
}
