import { defineConfig } from "vitest/config";
import { defaultConfig, promptTestsPattern } from "./vitest.config";
import { create } from "mutative";

const asDefineParam: Parameters<typeof defineConfig>[0] = defaultConfig;

const testTimeout = process.env.TEST_TIMEOUT
  ? parseInt(process.env.TEST_TIMEOUT)
  : 30000;

const config = create(asDefineParam, (draft) => {
  draft.test = draft.test ?? {};
  draft.test.include = [promptTestsPattern];
  draft.test.coverage = {};
  draft.test.maxConcurrency = 5;
  draft.test.testTimeout = testTimeout;
});

export default defineConfig(config);
