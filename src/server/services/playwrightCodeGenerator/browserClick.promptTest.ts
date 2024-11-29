import * as fs from "fs";
import path from "path";
import { getBrowserClickCoords } from "./browserClickCoordGetter";
import { z } from "zod";
import { testUserId } from "~/common/utils/testUtils";
import { isFailure } from "~/common/utils/result";
import { withPageContext } from "~/server/executors/browser";

vi.mock("~/env");
vi.mock("~/server/ai/llm/llmNotTestAsserter");

const testDataRootPath = path.join(__dirname, "../../../../testData");
if (!fs.existsSync(testDataRootPath)) {
  throw new Error(`File not found: ${testDataRootPath}`);
}

const timeoutMs = 100000;

describe(getBrowserClickCoords.name, () => {
  it("surpasses 98% accuracy", async () => {
    const testDataDirs = fs.readdirSync(testDataRootPath);
    const results = await withPageContext(
      async ({ browser }) => {
        return Promise.all(
          testDataDirs.map(async (testDataDir) => {
            const testDataDirPath = path.join(testDataRootPath, testDataDir);
            const screenshotPngBuffer = fs.readFileSync(
              path.join(testDataDirPath, "screenshot.png"),
            );
            const dataJson = fs.readFileSync(
              path.join(testDataDirPath, "data.json"),
              "utf8",
            );
            const { command, bboxes } = z
              .object({
                command: z.string(),
                bboxes: z.array(
                  z.object({
                    x0: z.number(),
                    y0: z.number(),
                    x1: z.number(),
                    y1: z.number(),
                  }),
                ),
              })
              .parse(JSON.parse(dataJson));
            const result = await getBrowserClickCoords({
              naturalLanguageCommand: command,
              screenshotPngBuffer,
              userId: testUserId,
              timeoutMs,
              browser,
            });
            if (isFailure(result)) {
              return result;
            }
            const { xCoord, yCoord } = result;
            const success = bboxes.some(({ x0, y0, x1, y1 }) => {
              return (
                x0 <= xCoord && xCoord <= x1 && y0 <= yCoord && yCoord <= y1
              );
            });
            return { testDataDir, success, bboxes, xCoord, yCoord };
          }),
        );
      },
      { timeoutMs },
    );
    const numSuccesses = results.filter(
      (result) => !isFailure(result) && result.success,
    ).length;
    const accuracy = numSuccesses / results.length;
    expect(accuracy).toBeGreaterThan(0.98);
  });
});
