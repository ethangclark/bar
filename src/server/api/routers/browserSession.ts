import { z } from "zod";
import { pngBufferToUrl } from "~/common/utils/pngUtils";
import {
  type Result,
  failure,
  isFailure,
  isNotFailure,
} from "~/common/utils/result";
import * as fs from "fs";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { createBrowserExecutor } from "~/server/executors/browserExecutor";
import {
  destroyManagedBrowserExecutor,
  getManagedBrowserExecutor,
  manageBrowserExecutor,
} from "~/server/services/browserExecutorManager";
import { getExecutableCommand } from "~/server/services/playwrightCodeGenerator/playwrightCodeGenerator";
import dayjs from "dayjs";
import { filter } from "~/common/utils/fnUtils";

export const browserSessionRouter = createTRPCRouter({
  start: publicProcedure
    .input(z.object({ url: z.string() }))
    .mutation(async ({ input }) => {
      const browserExecutor = await createBrowserExecutor(
        input.url,
        1000 * 60 * 60 * 12, // 12 hours
      );
      const id = await manageBrowserExecutor(browserExecutor);
      return { id };
    }),
  end: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await destroyManagedBrowserExecutor(input.id);
    }),
  submitCommand: publicProcedure
    .input(z.object({ id: z.string(), command: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const executor = getManagedBrowserExecutor(input.id);
      if (!executor) {
        throw new Error("Session not found");
      }

      const executableCommand = await getExecutableCommand({
        userId: ctx.userId,
        naturalLanguageCommand: input.command,
        screenshotPngBuffer: (await executor.takeScreenshot()).pngBuffer,
      });

      if (isFailure(executableCommand)) {
        return executableCommand;
      }

      await executor.exec(executableCommand);

      return {
        commandSubmitted: input.command,
        commandExecuted: executableCommand,
      };
    }),
  captureTestData: publicProcedure
    .input(
      z.object({ id: z.string(), command: z.string(), selector: z.string() }),
    )
    .mutation(async ({ input }) => {
      const { id, command, selector: rawSelector } = input;
      const executor = getManagedBrowserExecutor(id);
      if (!executor) {
        throw new Error("Session not found");
      }

      const screenshot = await executor.takeScreenshot();

      const page = executor._getPageContext().page;

      const selectors = rawSelector.split(/ *% */);

      const bboxesRaw = await Promise.all(
        selectors.map(async (selector) => {
          // Get the element handle
          const elementHandle = await page
            .locator(selector)
            .first()
            .elementHandle({ timeout: 1000 });
          // const elementHandle = page.locator(`xpath=${selector}`);
          // const elementHandle = await page.$(selector);
          if (!elementHandle) {
            return failure("Element not found on the page.");
          }

          // Get the bounding box of the element
          const boundingBox = await elementHandle.boundingBox();
          if (!boundingBox) {
            return failure(
              "Unable to retrieve bounding box. The element might not be visible.",
            );
          }

          // Calculate the top-left and bottom-right coordinates
          const x0 = boundingBox.x;
          const y0 = boundingBox.y;
          const x1 = boundingBox.x + boundingBox.width;
          const y1 = boundingBox.y + boundingBox.height;

          const bbox = { x0, y0, x1, y1 };
          return bbox;
        }),
      );
      if (bboxesRaw.some(isFailure)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return bboxesRaw.find(isFailure)!;
      }
      type Bbox = {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
      };
      const bboxes = filter<Result<Bbox>, Bbox>(bboxesRaw, isNotFailure);

      const dataDir = dayjs().format("YYYY-MM-DD-HH-mm-ss");

      fs.mkdirSync(`testData/${dataDir}`, { recursive: true });
      fs.writeFileSync(
        `testData/${dataDir}/data.json`,
        JSON.stringify({ command, bboxes }, null, 2),
      );
      fs.writeFileSync(
        `testData/${dataDir}/screenshot.png`,
        screenshot.pngBuffer,
      );

      return {
        command,
        selector: rawSelector,
        outlinedClickAreaImageDataUrl: pngBufferToUrl(screenshot.pngBuffer),
        bboxes,
      };
    }),
});
