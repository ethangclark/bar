import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";
import { noop } from "~/common/fnUtils";
import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { GET, POST } from "./route";

vi.mock("@trpc/server/adapters/fetch", () => ({
  fetchRequestHandler: vi.fn(),
}));

vi.mock("~/env");

vi.mock("~/server/api/root", () => ({
  appRouter: {},
}));

vi.mock("~/server/api/trpc", () => ({
  createTRPCContext: vi.fn(),
}));

describe("tRPC route handler", () => {
  const mockHeaders = new Headers();
  const mockCookies = { get: vi.fn() };
  const mockRequest = {
    headers: mockHeaders,
    cookies: mockCookies,
  } as unknown as NextRequest;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call fetchRequestHandler with the correct arguments for GET", async () => {
    await GET(mockRequest);

    expect(fetchRequestHandler).toHaveBeenCalledWith({
      endpoint: "/api/trpc",
      req: mockRequest,
      router: appRouter,
      createContext: expect.any(Function),
      onError: undefined,
    });
  });

  it("should call fetchRequestHandler with the correct arguments for POST", async () => {
    await POST(mockRequest);

    expect(fetchRequestHandler).toHaveBeenCalledWith({
      endpoint: "/api/trpc",
      req: mockRequest,
      router: appRouter,
      createContext: expect.any(Function),
      onError: undefined,
    });
  });

  it("should use createTRPCContext to create context", async () => {
    await GET(mockRequest);

    const createContext =
      vi.mocked(fetchRequestHandler).mock.calls[0]?.[0].createContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (createContext as any)();

    expect(createTRPCContext).toHaveBeenCalledWith({
      headers: mockHeaders,
      sessionCookieValue: null,
    });
  });

  it("should log errors in development mode", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (env as any).NODE_ENV = "development";

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(noop);

    const mockError = new Error("Test error");
    await GET(mockRequest);
    const onError = vi.mocked(fetchRequestHandler).mock.calls[0]?.[0].onError;

    if (onError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError({ path: "testPath", error: mockError } as Parameters<
        typeof onError
      >[0]);
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "❌ tRPC failed on testPath: Test error",
      mockError,
    );

    consoleErrorSpy.mockRestore();
  });
});
