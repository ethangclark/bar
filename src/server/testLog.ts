import { writeFileSync } from "fs";
import { env } from "~/env";

type Action = "write" | "append" | "clear";

function writeToLogs(
  fileName: string,
  content: string | Buffer,
  action: Action = "write",
) {
  if (env.NODE_ENV === "production") {
    console.log(`Attempted to log at ${fileName}`, new Error().stack);
    return;
  }
  console.log(
    `Logging at ${fileName}: ${Buffer.isBuffer(content) ? "<Buffer>" : content}`,
  );
  switch (action) {
    case "write":
      writeFileSync(`logs/${fileName}`, content);
      break;
    case "append":
      writeFileSync(`logs/${fileName}`, content, {
        flag: "a",
      });
      break;
    case "clear":
      writeFileSync(`logs/${fileName}`, "");
      break;
  }
}

export function testLogAsTxt<T>(logName: string, content: T) {
  const serialized = JSON.stringify(content, null, 2);
  const withNewlinesLegible = serialized.replace(/\\n/g, "\n");
  writeToLogs(logName + ".txt", withNewlinesLegible);
}

export function testLogPng(logName: string, pngBuffer: Buffer) {
  writeToLogs(logName + ".png", pngBuffer);
}
