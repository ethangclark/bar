import * as fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolvePath(filePath: string): string {
  return path.resolve(__dirname, filePath);
}

const unitModuleListPath = resolvePath("./unitModuleList.txt");
const topicListPath = resolvePath("./topicList.txt");
const topicPrefaceChar = "•";
const isLineAModuleTitle = (line: string) => line.includes(":");

const unitModuleListContent = fs.readFileSync(unitModuleListPath, "utf8");
const topicListContent = fs.readFileSync(topicListPath, "utf8");

// Function to read and parse the course outline
export function getModuleList() {
  return unitModuleListContent
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => line.trim());
}

export function getTopics() {
  // Split content into lines and remove empty lines
  const lines = topicListContent.split("\n").filter((line) => line.trim());

  const modules = [];
  let currentModule = null;
  let currentTopics = [];

  for (let line of lines) {
    // Remove any tab characters and trim whitespace
    line = line.replace(/\t/g, "").trim();

    // Skip introduction text or empty lines
    if (!line) continue;

    // If line contains a colon, it's likely a module title
    if (isLineAModuleTitle(line)) {
      // If we have a previous module, save it
      if (currentModule) {
        modules.push({
          module: currentModule,
          topics: currentTopics,
        });
      }

      // Start new module
      currentModule = line.trim();
      currentTopics = [];
    } else {
      currentTopics.push(
        line
          .trim()
          .split(topicPrefaceChar)
          .slice(1)
          .join(topicPrefaceChar)
          .trim(),
      );
    }
  }

  // Add the last module
  if (currentModule) {
    modules.push({
      module: currentModule,
      topics: currentTopics,
    });
  }

  return modules;
}

console.log(JSON.stringify(getTopics(), null, 2));
