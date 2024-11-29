import { type Browser } from "playwright";
import {
  browsyBrowserHeight,
  browsyBrowserWidth,
  pageLoadedClassname,
} from "~/common/utils/constants";
import { getBaseUrl } from "~/common/utils/urlUtils";
import { withPageContext } from "~/server/executors/browser";
import { withPersistedPng } from "~/server/services/pngPersistor";

export async function annotateScreenshotRows({
  pngBuffer,
  timeoutMs,
  browser,
}: {
  pngBuffer: Buffer;
  timeoutMs: number;
  browser?: Browser;
}): Promise<{
  annotatedPngBuffer: Buffer;
}> {
  return withPersistedPng(pngBuffer, async (pngUuid) => {
    const baseUrl = getBaseUrl();

    const annotatedScreenshotUrl = `${baseUrl}/annotatedScreenshotRows/${pngUuid}`;

    const result = await withPageContext(
      async ({ page }) => {
        await page.goto(annotatedScreenshotUrl);
        await page.waitForSelector(`.${pageLoadedClassname}`);
        const screenshot = await page.screenshot();
        return { annotatedPngBuffer: screenshot };
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

    console.log("annotated screenshot rows; URL:", annotatedScreenshotUrl);

    return result;
  });
}
