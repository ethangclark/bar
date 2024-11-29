import NextAuth from "next-auth";
import * as handlerModule from "./route";

// Mock NextAuth function
vi.mock("next-auth", () => ({
  default: vi.fn(() => "mockHandler"),
}));
vi.mock("~/server/auth", () => ({
  authOptions: "mockValue",
}));

describe("Auth Handler", () => {
  it("should export GET and POST handlers", () => {
    // Check if handlers are exported correctly
    expect(handlerModule.GET).toBe("mockHandler");
    expect(handlerModule.POST).toBe("mockHandler");

    // Ensure NextAuth was called with the correct authOptions
    expect(NextAuth).toHaveBeenCalledWith("mockValue");
  });
});
