/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createBrowserExecutor,
  createSetupStep,
  withBrowserExecutor,
} from "./browserExecutor";
import { pageContextCreator, takeScreenshot } from "./browser";
import { initializeStepwiseExecutor } from "./stepwiseExecutor";

// Mock dependencies
vi.mock("./browser", () => ({
  pageContextCreator: {
    createPageContext: vi.fn(),
  },
  takeScreenshot: vi.fn(),
}));

vi.mock("./stepwiseExecutor", () => ({
  initializeStepwiseExecutor: vi.fn(),
}));

describe("browserExecutor", () => {
  let mockBrowser: any;
  let mockPage: any;
  let mockStepExecutor: any;

  beforeEach(() => {
    mockBrowser = {
      close: vi.fn(),
    };
    mockPage = {
      goto: vi.fn(),
    };
    mockStepExecutor = {
      exec: vi.fn(),
    };

    (pageContextCreator.createPageContext as any).mockResolvedValue({
      browser: mockBrowser,
      page: mockPage,
    });
    (initializeStepwiseExecutor as any).mockResolvedValue(mockStepExecutor);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createBrowserExecutor", () => {
    it("should create a browser executor", async () => {
      const executor = await createBrowserExecutor(
        "https://example.com",
        5000,
        123,
      );
      expect(executor).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(executor.exec).toBeInstanceOf(Function);
      expect(executor._destroy).toBeInstanceOf(Function);
      expect(executor.takeScreenshot).toBeInstanceOf(Function);
    });

    it("should execute steps", async () => {
      const executor = await createBrowserExecutor(
        "https://example.com",
        5000,
        123,
      );
      await executor.exec('console.log("test")');
      expect(mockStepExecutor.exec).toHaveBeenCalledWith('console.log("test")');
    });

    it("should take screenshots", async () => {
      const executor = await createBrowserExecutor(
        "https://example.com",
        5000,
        123,
      );
      await executor.takeScreenshot();
      expect(takeScreenshot).toHaveBeenCalledWith({ page: mockPage });
    });

    it("should destroy the browser", async () => {
      const executor = await createBrowserExecutor(
        "https://example.com",
        5000,
        123,
      );
      await executor._destroy();
      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe("withBrowserExecutor", () => {
    it("should execute callback and destroy browser", async () => {
      const mockCallback = vi.fn().mockResolvedValue("result");
      const { callbackResult, browserExecResult } = await withBrowserExecutor(
        "https://example.com",
        5000,
        mockCallback,
      );

      expect(callbackResult).toBe("result");
      expect(browserExecResult).toEqual({
        stepsExecuted: expect.any(Array),
        lastExecutionError: null,
      });
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it("should handle errors and destroy browser", async () => {
      const mockCallback = vi.fn().mockRejectedValue(new Error("Test error"));

      await expect(
        withBrowserExecutor("https://example.com", 5000, mockCallback),
      ).rejects.toThrow("Test error");

      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe("restoreCheckpoint", () => {
    it("should restore checkpoint when steps are different", async () => {
      const executor = await createBrowserExecutor(
        "https://example.com",
        5000,
        123,
      );

      // Mock createSeedInt to return a predictable value
      vi.mock("../services/seedInt", () => ({
        createSeedInt: vi.fn().mockResolvedValue(456),
      }));

      const checkpoint = {
        executedJsSteps: ['console.log("step1")', 'console.log("step2")'],
      };

      await executor.exec('console.log("different step")');
      await executor.restoreCheckpoint(checkpoint, 123);

      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
      expect(pageContextCreator.createPageContext).toHaveBeenCalledTimes(2);
      expect(initializeStepwiseExecutor).toHaveBeenCalledTimes(2);
      expect(mockStepExecutor.exec).toHaveBeenCalledWith(
        'console.log("step1")',
      );
      expect(mockStepExecutor.exec).toHaveBeenCalledWith(
        'console.log("step2")',
      );
    });

    it("should not restore checkpoint when steps are the same", async () => {
      const executor = await createBrowserExecutor(
        "https://example.com",
        5000,
        123,
      );

      const checkpoint = {
        executedJsSteps: [
          createSetupStep("https://example.com"),
          'console.log("step1")',
          'console.log("step2")',
        ],
      };

      await executor.exec('console.log("step1")');
      await executor.exec('console.log("step2")');

      await executor.restoreCheckpoint(checkpoint, 123);

      expect(mockBrowser.close).not.toHaveBeenCalled();
      expect(pageContextCreator.createPageContext).toHaveBeenCalledTimes(1);
      expect(initializeStepwiseExecutor).toHaveBeenCalledTimes(1);
    });

    it("should handle string input for checkpoint", async () => {
      const executor = await createBrowserExecutor(
        "https://example.com",
        5000,
        123,
      );

      // Mock createSeedInt to return a predictable value
      vi.mock("../services/seedInt", () => ({
        createSeedInt: vi.fn().mockResolvedValue(456),
      }));

      await executor.restoreCheckpoint('console.log("single step")', 123);

      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
      expect(pageContextCreator.createPageContext).toHaveBeenCalledTimes(2);
      expect(initializeStepwiseExecutor).toHaveBeenCalledTimes(2);
      expect(mockStepExecutor.exec).toHaveBeenCalledWith(
        'console.log("single step")',
      );
    });
  });
});
