import { defineConfig } from "vitest/config";
import tsconfig from "./tsconfig.json";

import path from "path";

// https://christophervachon.com/blog/2024-04-15-vitest-typescript-paths/
// Create an alias object from the paths in tsconfig.json
const alias = Object.fromEntries(
  // For Each Path in tsconfig.json
  Object.entries(tsconfig.compilerOptions.paths).map(([key, [value]]) => [
    // Remove the "/*" from the key and resolve the path
    key.replace("/*", ""),
    // Remove the "/*" from the value Resolve the relative path
    path.resolve(__dirname, value?.replace("/*", "") ?? ""),
  ]),
);

export const promptTestsPattern = "src/**/*.promptTest.ts";

export const defaultConfig = {
  resolve: { alias },
  test: {
    globals: true,

    // // I hate component testing and have never seen it provide value.
    // // Display logic should be simple enough that type-checking should cover.
    // // If it's not, it should be factored out into a .ts file and tested there.
    // environment: "jsdom",
    // setupFiles: "./vitest.setup.ts", // import '@testing-library/jest-dom'; // yarn add @testing-library/react @testing-library/jest-dom -D

    coverage: {
      enabled: true,
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.tsx",
        "**/node_modules/**",
        "src/common/schemas/**",
        promptTestsPattern,
        "**/__mocks__/**",
      ],
      provider: "v8" as const,
      thresholds: {
        branches: 80,
      },
      reporter: [
        // "text",
        "text-summary",
      ],
    },
  },
};

export default defineConfig(defaultConfig);
