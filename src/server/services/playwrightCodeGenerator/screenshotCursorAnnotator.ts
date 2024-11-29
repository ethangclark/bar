import { type Browser } from "playwright";
import {
  browsyBrowserHeight,
  browsyBrowserWidth,
  pageLoadedClassname,
} from "~/common/utils/constants";
import { getBaseUrl } from "~/common/utils/urlUtils";
import { withPageContext } from "~/server/executors/browser";
import { withPersistedPng } from "~/server/services/pngPersistor";

export async function annotateScreenshotCursor({
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
  annotatedCursorBuffer: Buffer;
}> {
  return withPersistedPng(pngBuffer, async (pngUuid) => {
    const baseUrl = getBaseUrl();

    const annotatedScreenshotUrl = `${baseUrl}/annotatedScreenshotCursor/${pngUuid}?rowIdx=${rowIdx}&columnIdx=${columnIdx}`;

    const result = await withPageContext(
      async ({ page }) => {
        await page.goto(annotatedScreenshotUrl);
        await page.waitForSelector(`.${pageLoadedClassname}`);
        const screenshot = await page.screenshot();
        return { annotatedCursorBuffer: screenshot };
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
      "(cursor) annotated screenshot cursor URL:",
      annotatedScreenshotUrl,
    );

    return result;
  });
}
