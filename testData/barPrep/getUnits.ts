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
export const unitModuleInfix = ": ";
const isLineARawModuleName = (line: string) => line.includes(unitModuleInfix);

export function rawModuleNameToUnitAndModuleName(rawModuleName: string) {
  const [unitName, moduleName] = rawModuleName.split(unitModuleInfix);
  if (!unitName || !moduleName) {
    throw new Error(`Invalid module name: ${rawModuleName}`);
  }
  return { unitName, moduleName };
}

const unitModuleListContent = fs.readFileSync(unitModuleListPath, "utf8");
const topicListContent = fs.readFileSync(topicListPath, "utf8");

// Function to read and parse the course outline
export function getRawModuleListFromFile() {
  return unitModuleListContent
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => line.trim());
}

type Module = {
  name: string;
  topics: string[];
};
type Unit = {
  name: string;
  modules: Module[];
};

export function getRawModules(): Module[] {
  // Split content into lines and remove empty lines
  const lines = topicListContent.split("\n").filter((line) => line.trim());

  const rawModules = Array<Module>();
  let currentModule = null;
  let currentTopics = [];

  for (let line of lines) {
    // Remove any tab characters and trim whitespace
    line = line.replace(/\t/g, "").trim();

    // Skip introduction text or empty lines
    if (!line) continue;

    // If line contains a colon, it's likely a module title
    if (isLineARawModuleName(line)) {
      // If we have a previous module, save it
      if (currentModule) {
        rawModules.push({
          name: currentModule,
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
    rawModules.push({
      name: currentModule,
      topics: currentTopics,
    });
  }

  return rawModules;
}

export function getUnits(): Unit[] {
  const rawModules = getRawModules();

  const units = Array<Unit>();
  let currentUnit = null;
  let currentModules = [];
  for (const rawModule of rawModules) {
    const { unitName, moduleName } = rawModuleNameToUnitAndModuleName(
      rawModule.name,
    );
    if (currentUnit !== unitName) {
      if (currentUnit) {
        units.push({
          name: currentUnit,
          modules: currentModules,
        });
      }
      currentUnit = unitName;
      currentModules = [];
    }
    currentModules.push({
      ...rawModule,
      name: moduleName,
    });
  }

  // Add the last unit
  if (currentUnit) {
    units.push({
      name: currentUnit,
      modules: currentModules,
    });
  }

  return units;
}
