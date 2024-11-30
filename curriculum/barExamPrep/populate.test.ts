import { getCourseModules, getDefinedTopics } from "./populate";

// Function to find modules without topics
function findMissingTopics() {
  // Read both files
  const courseModules = getCourseModules();
  const definedTopics = getDefinedTopics();

  // Find modules that don't have corresponding topics
  const missingTopics = courseModules.filter(
    (module) => !definedTopics.some((topic) => topic === module),
  );

  if (missingTopics.length === 0) {
    console.log("All modules have topics defined!");
  } else {
    console.log("Modules without defined topics:");
    missingTopics.forEach((module, index) => {
      console.log(`${index + 1}. ${module}`);
    });
  }

  return { missingTopics };
}

describe("populate", () => {
  test("findMissingTopics", () => {
    const { missingTopics } = findMissingTopics();
    expect(missingTopics).toHaveLength(0);
  });
});
