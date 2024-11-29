import { type Browser, chromium, type Page } from "playwright";
import fs from "fs";
import {
  browsyBrowserHeight,
  browsyBrowserWidth,
} from "~/common/utils/constants";
import { env } from "~/env";

const defaultBrowser = chromium;
const defaultBrowserDims = {
  width: browsyBrowserWidth,
  height: browsyBrowserHeight,
};
const defaultHeadless = env.NODE_ENV === "production" || !env.HEADFUL;

export type PageContext = { browser: Browser; page: Page };

type PageContextParams = {
  headless?: boolean;
  timeoutMs: number;
  browserDims?: { width: number; height: number };
  browser?: Browser;
};

const defaultPageContextParams: Partial<PageContextParams> = {
  headless: defaultHeadless,
  browserDims: defaultBrowserDims,
};

async function createPageContext(pageContextParams: PageContextParams) {
  pageContextParams = { ...defaultPageContextParams, ...pageContextParams };
  const { headless, browserDims, timeoutMs } = pageContextParams;
  const browser =
    pageContextParams.browser ?? (await defaultBrowser.launch({ headless }));
  const playwrightContext = await browser.newContext({ viewport: browserDims });
  const page = await playwrightContext.newPage();
  playwrightContext.on("page", async (page) => {
    await page.close(); // TODO: we'll want to do something with this at some point :/ might be tough to figure out a way to fit this into control flow because it's not clear when exactly it'll happen
  });

  page.setDefaultTimeout(timeoutMs);
  setTimeout(
    () => {
      void browser.close();
    },
    1 * 60 * 60 * 1000,
  ); // 1 hour -- failsafe to prevent hanging. TODO: maybe require IP address to create a browser and close prev ones when one's created for that IP address? Or do more intelligently base don parallelization allowance or smth? (Nah -- we need good cleanup for Lambda.)
  return { browser, page, playwrightContext };
}

export const pageContextCreator = { createPageContext };

export async function withPageContext<T>(
  cb: (args: PageContext) => Promise<T>,
  pageContextParams: PageContextParams,
) {
  pageContextParams = { ...defaultPageContextParams, ...pageContextParams };
  const { browser, page, playwrightContext } =
    await pageContextCreator.createPageContext(pageContextParams);
  try {
    return await cb({ browser, page });
  } finally {
    if (pageContextParams.browser) {
      // closes all pages created with this context and cleans up the context
      await playwrightContext.close();
    } else {
      await browser.close();
    }
  }
}

export async function takeScreenshot({
  page,
  filePath = env.NODE_ENV === "production"
    ? `/tmp/${Math.random().toString(36).slice(2)}.png`
    : "logs/screenshot.png",
}: {
  page: Page;
  filePath?: string;
}) {
  // Take a screenshot and save it to the specified file path
  await page.screenshot({ path: filePath });

  // read the file into memory
  const pngBuffer = fs.readFileSync(filePath);

  return { filePath, pngBuffer };
}
