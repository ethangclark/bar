/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { pageContextCreator, withPageContext, takeScreenshot } from "./browser";
import { chromium } from "playwright";
import fs from "fs";
import {
  browsyBrowserHeight,
  browsyBrowserWidth,
} from "~/common/utils/constants";

vi.mock("playwright", () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  default: {
    readFileSync: vi.fn(),
  },
}));

describe("browser", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createPageContext", () => {
    it("should create a page context with default parameters", async () => {
      const mockBrowser = {
        newContext: vi.fn().mockResolvedValue({
          newPage: vi.fn().mockResolvedValue({
            setDefaultTimeout: vi.fn(),
          }),
          on: vi.fn(),
        }),
        close: vi.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/unbound-method, @typescript-eslint/no-explicit-any
      vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as any);

      const result = await pageContextCreator.createPageContext({
        timeoutMs: 5000,
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(chromium.launch).toHaveBeenCalledWith({
        headless: expect.any(Boolean),
      });
      expect(result).toHaveProperty("browser");
      expect(result).toHaveProperty("page");
    });

    it("should create a page context with custom parameters", async () => {
      const mockBrowser = {
        newContext: vi.fn().mockResolvedValue({
          newPage: vi.fn().mockResolvedValue({
            setDefaultTimeout: vi.fn(),
          }),
          on: vi.fn(),
        }),
        close: vi.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/unbound-method, @typescript-eslint/no-explicit-any
      vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as any);

      const customParams = {
        headless: false,
        viewport: { width: browsyBrowserWidth, height: browsyBrowserHeight },
        timeoutMs: 10000,
      };

      const result = await pageContextCreator.createPageContext(customParams);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(chromium.launch).toHaveBeenCalledWith({
        headless: false,
      });
      expect(mockBrowser.newContext).toHaveBeenCalledWith({
        viewport: { width: browsyBrowserWidth, height: browsyBrowserHeight },
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(result.page.setDefaultTimeout).toHaveBeenCalledWith(10000);
    });
  });

  describe("withPageContext", () => {
    it("should execute callback with page context and close browser", async () => {
      const mockPageContext = {
        browser: { close: vi.fn() },
        page: {},
      };
      vi.spyOn(pageContextCreator, "createPageContext").mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockPageContext as any,
      );

      const mockCallback = vi.fn().mockResolvedValue("result");

      const result = await withPageContext(mockCallback, { timeoutMs: 5000 });

      expect(mockCallback).toHaveBeenCalledWith(mockPageContext);
      expect(mockPageContext.browser.close).toHaveBeenCalled();
      expect(result).toBe("result");
    });

    it("should close the browser even if the callback throws an error", async () => {
      const mockPageContext = {
        browser: { close: vi.fn() },
        page: {},
      };
      vi.spyOn(pageContextCreator, "createPageContext").mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockPageContext as any,
      );

      const mockCallback = vi.fn().mockRejectedValue(new Error("Test error"));

      await expect(
        withPageContext(mockCallback, { timeoutMs: 5000 }),
      ).rejects.toThrow("Test error");

      expect(mockCallback).toHaveBeenCalledWith(mockPageContext);
      expect(mockPageContext.browser.close).toHaveBeenCalled();
    });
  });

  describe("takeScreenshot", () => {
    it("should take a screenshot and return file path and image data", async () => {
      const mockPage = {
        screenshot: vi.fn().mockResolvedValue(undefined),
      };
      const mockFilePath = "test/screenshot.png";
      const mockImageData = Buffer.from("fake image data");

      vi.mocked(fs.readFileSync).mockReturnValue(mockImageData);

      const result = await takeScreenshot({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        page: mockPage as any,
        filePath: mockFilePath,
      });

      expect(mockPage.screenshot).toHaveBeenCalledWith({ path: mockFilePath });
      expect(fs.readFileSync).toHaveBeenCalledWith(mockFilePath);
      expect(result).toEqual({
        filePath: mockFilePath,
        pngBuffer: mockImageData,
      });
    });

    it("should use a default file path in production environment", async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = "production";

      const mockPage = {
        screenshot: vi.fn().mockResolvedValue(undefined),
      };
      const mockImageData = Buffer.from("fake image data");

      vi.mocked(fs.readFileSync).mockReturnValue(mockImageData);

      const result = await takeScreenshot({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        page: mockPage as any,
      });

      expect(mockPage.screenshot).toHaveBeenCalledWith({
        path: expect.stringMatching(/^\/tmp\/.*\.png$/),
      });
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringMatching(/^\/tmp\/.*\.png$/),
      );
      expect(result).toHaveProperty("filePath");
      expect(result).toHaveProperty("pngBuffer", mockImageData);

      (process.env as any).NODE_ENV = originalNodeEnv;
    });
  });
});
