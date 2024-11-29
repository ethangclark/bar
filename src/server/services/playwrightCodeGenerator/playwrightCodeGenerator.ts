import { isFailure, type Result } from "~/common/utils/result";
import { getBrowserClickCoords } from "./browserClickCoordGetter";
import { getCommandType } from "./getCommandType";

export async function getExecutableCommand({
  naturalLanguageCommand,
  screenshotPngBuffer,
  userId,
}: {
  naturalLanguageCommand: string;
  screenshotPngBuffer: Buffer;
  userId: string;
}): Promise<Result<string>> {
  const commandTypeResult = await getCommandType({
    userId,
    naturalLanguageCommand,
  });

  if (isFailure(commandTypeResult)) {
    return commandTypeResult;
  }
  const { commandType } = commandTypeResult;

  if (commandType !== "click_something") {
    throw Error("only click_something is supported");
  }

  const timeoutMs = 10000;

  const clickCoordsResult = await getBrowserClickCoords({
    naturalLanguageCommand,
    screenshotPngBuffer,
    userId,
    timeoutMs,
  });
  if (isFailure(clickCoordsResult)) {
    return clickCoordsResult;
  }
  const { xCoord, yCoord } = clickCoordsResult;

  console.log({ xCoord, yCoord }); // for testing :)

  return `await page.mouse.click(${xCoord}, ${yCoord});`;
}
