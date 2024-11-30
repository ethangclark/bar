import exp from "constants";
import {
  getRawModuleListFromFile,
  getRawModules,
  getUnits,
  rawModuleNameToUnitAndModuleName,
  unitModuleInfix,
} from "./populate";

describe("getRawModules", () => {
  it("includes all expected modules based on the raw module list file", () => {
    const rawModulesStr = getRawModuleListFromFile().sort().join("");
    const topicsStr = getRawModules()
      .map((t) => t.name)
      .sort()
      .join("");
    expect(rawModulesStr).toEqual(topicsStr);
  });
  test("every raw module name contains a unit name and module name", () => {
    const rawModules = getRawModules();
    for (const rawModule of rawModules) {
      rawModuleNameToUnitAndModuleName(rawModule.name); // will throw if not the case
    }
  });
});

describe("getUnits", () => {
  it("matches up with rawModules", () => {
    const units = getUnits();
    const derivedRawModuleNames = Array<string>();
    units.forEach((unit) => {
      unit.modules.forEach((module) => {
        derivedRawModuleNames.push(
          `${unit.name}${unitModuleInfix}${module.name}`,
        );
      });
    });

    const derivedStr = derivedRawModuleNames.sort().join("");
    const rawModulesStr = getRawModuleListFromFile().sort().join("");
    expect(derivedStr).toEqual(rawModulesStr);
  });
  it("contains topics for each module", () => {
    const units = getUnits();
    units.forEach((unit) => {
      unit.modules.forEach((module) => {
        expect(module.topics.length).toBeGreaterThan(0);
      });
    });
  });
});
