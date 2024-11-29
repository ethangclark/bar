import { type Browser, type Page } from "playwright";
import { expect } from "@playwright/test";
import { pageContextCreator, takeScreenshot } from "~/server/executors/browser";
import { initializeStepwiseExecutor } from "~/server/executors/stepwiseExecutor";
import { splitPromise } from "~/common/utils/promiseUtils";
import { assertError } from "~/common/utils/errorUtils";
import { type Checkpoint } from "~/common/schemas/checkpoint";
import { createSeedInt } from "../services/seedInt";

// do not modify this without modifying `implicitSteps` as well
export type ExecutorParams = {
  browser: Browser;
  page: Page;
  expect: typeof expect;
};
// do not modify this without modifying `ExecutorParams` as well
export const implicitSteps = [
  `// Playwright's "${"expect" satisfies keyof ExecutorParams}" function has been loaded globally (from @playwright/test)\n`,
  `// Launch the browser
const ${"browser" satisfies keyof ExecutorParams} = await defaultBrowser.launch(); // chromium, or whatever we're running`,
  `// Open a new page
const ${"page" satisfies keyof ExecutorParams} = await browser.newPage();`,
];

export const createSetupStep = (url: string) => `// Navigate to the URL
await page.goto('${url}')`;

const innerCreateBrowserExecutor = async (url: string, timeoutMs: number) => {
  const pageContext = await pageContextCreator.createPageContext({ timeoutMs });
  const { browser, page } = pageContext;
  const params: ExecutorParams = {
    browser,
    page,
    expect,
  };

  const setupStep = createSetupStep(url);
  try {
    const stepExecutor = await initializeStepwiseExecutor(params, setupStep);
    return { pageContext, setupStep, stepExecutor };
  } catch (error) {
    await pageContext.browser.close();
    throw error;
  }
};

type OnDestroyParams = {
  stepsExecuted: string[];
  lastExecutionError: Error | null;
};
type OnDestroy = (params: OnDestroyParams) => void;

export async function createBrowserExecutor(
  url: string,
  timeoutMs: number,
  initialSeedInt?: number,
  onDestroy?: OnDestroy,
) {
  let { pageContext, setupStep, stepExecutor } =
    await innerCreateBrowserExecutor(url, timeoutMs);

  const staticExecuted = [setupStep];
  let lastExecutionError: Error | null = null;
  const getStepsExecuted = () => [...staticExecuted];
  let seedInt = initialSeedInt ?? (await createSeedInt());

  const _destroy = async () => {
    await pageContext.browser.close();
    const stepsExecuted = getStepsExecuted();
    while (staticExecuted.length > 0) {
      staticExecuted.pop();
    }
    const e = lastExecutionError;
    lastExecutionError = null;
    onDestroy?.({ stepsExecuted, lastExecutionError: e });
  };

  const browserExecutor = {
    async exec(step: string) {
      try {
        await stepExecutor.exec(step);
        staticExecuted.push(step); // only include successful steps
      } catch (error) {
        assertError(error);
        lastExecutionError = error;
        throw error;
      }
    },
    _executed: staticExecuted,
    getStepsExecuted,
    _destroy,
    takeScreenshot: () => takeScreenshot({ page: pageContext.page }),
    getCheckpoint: (): Checkpoint => ({ executedJsSteps: getStepsExecuted() }),
    async restoreCheckpoint(
      checkpointOrExecutedJs: Checkpoint | string,
      checkpointSeedInt: number,
    ) {
      const checkpoint: Checkpoint =
        typeof checkpointOrExecutedJs === "string"
          ? { executedJsSteps: [checkpointOrExecutedJs] }
          : checkpointOrExecutedJs;
      if (
        !lastExecutionError &&
        checkpoint.executedJsSteps.length === staticExecuted.length &&
        checkpoint.executedJsSteps.every(
          (step, i) => step === staticExecuted[i],
        )
      ) {
        return;
      }

      await _destroy();

      const newSeedInt = await createSeedInt();
      const reseededCheckpoint: Checkpoint = {
        executedJsSteps: checkpoint.executedJsSteps.map((step) =>
          step.replaceAll(checkpointSeedInt.toString(), newSeedInt.toString()),
        ),
      };
      seedInt = newSeedInt;

      ({ pageContext, setupStep, stepExecutor } =
        await innerCreateBrowserExecutor(url, timeoutMs));

      for (const step of reseededCheckpoint.executedJsSteps) {
        await browserExecutor.exec(step);
      }
    },
    getSeedInt: () => seedInt,
    _getPageContext: () => pageContext,
  };

  return browserExecutor;
}

export async function withBrowserExecutor<T>(
  url: string,
  timeoutMs: number,
  cb: (executor: BrowserExecutor) => Promise<T>,
): Promise<{ callbackResult: T; browserExecResult: OnDestroyParams }> {
  const seedInt = await createSeedInt();
  const { promise: onDestroyResultPromise, resolve } =
    splitPromise<OnDestroyParams>();
  const browserExecutor = await createBrowserExecutor(
    url,
    timeoutMs,
    seedInt,
    resolve,
  );
  try {
    const callbackResult = await cb(browserExecutor);
    await browserExecutor._destroy();
    const onDestroyResult = await onDestroyResultPromise;
    return { callbackResult, browserExecResult: onDestroyResult };
  } catch (error) {
    await browserExecutor._destroy();
    throw error;
  }
}

export type BrowserExecutor = Awaited<ReturnType<typeof createBrowserExecutor>>;
