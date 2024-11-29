import { spawn } from "child_process";
import { existsSync } from "fs";

let times = parseInt(process.env.TIMES ?? "0");
if (isNaN(times) || times < 1) {
  times = 1;
}

// Get the filter from the command line arguments
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [_, __, fileRelPath] = process.argv;
if (!fileRelPath || !existsSync(fileRelPath)) {
  console.error("Please pass the path of a file for the prompt tests.");
  process.exit(1);
}

const runTest = (attempt: number) => {
  return new Promise<void>((resolve, reject) => {
    const testProcess = spawn(
      "yarn",
      [
        "run",
        "vitest",
        "--run",
        "-c",
        "./vitest.promptTest.config.ts",
        fileRelPath, // only running this file
      ],
      {
        stdio: "inherit",
      },
    );

    testProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Attempt ${attempt} failed with exit code ${code}`));
      } else {
        resolve();
      }
    });
  });
};

const runTests = async () => {
  const startTime = Date.now();
  try {
    for (let i = 1; i <= times; i++) {
      console.log(`Running attempt ${i}...`);
      await runTest(i);
    }
    console.log(
      `All tests passed successfully in ${(Date.now() - startTime) / 1000}s`,
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
};

void runTests();
