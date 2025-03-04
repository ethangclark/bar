import createSubscriber from "pg-listen";
import superjson from "superjson";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PubSub } from "./pubsub";
vi.mock("~/env");

// Mock the cache service
vi.mock("~/server/services/cacheService", () => ({
  cache: vi.fn(async () => ({ id: "cache-id-123" })),
  getCache: vi.fn(async ({ id }) => {
    if (id === "cache-id-123") return 42000; // Large test value
    throw new Error("Cache not found");
  }),
}));

type FakeSubscriber = {
  notifications: { on: ReturnType<typeof vi.fn> };
  connect: ReturnType<typeof vi.fn>;
  listenTo: ReturnType<typeof vi.fn>;
  notify: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
};

// The vi.mock factory returns a new fake subscriber on each call.
vi.mock("pg-listen", () => {
  const createFakeSubscriber = (): FakeSubscriber => ({
    notifications: { on: vi.fn() },
    connect: vi.fn(() => Promise.resolve()),
    listenTo: vi.fn(() => Promise.resolve()),
    notify: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
  });
  return {
    default: vi.fn(() => createFakeSubscriber()),
    __esModule: true,
  };
});

import { cache, getCache } from "~/server/services/cacheService";

describe("PubSub", () => {
  let pubsub: PubSub<number>;
  let fakeSubscriberInstance: FakeSubscriber;

  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (createSubscriber as any).mockClear();
    vi.mocked(cache).mockClear();
    vi.mocked(getCache).mockClear();

    pubsub = new PubSub<number>("test-channel");
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    fakeSubscriberInstance = (
      createSubscriber as unknown as {
        mock: { results: Array<{ value: FakeSubscriber }> };
      }
    ).mock.results.slice(-1)[0]!.value;
    await fakeSubscriberInstance.connect();
    await fakeSubscriberInstance.listenTo("test-channel");
  });

  it("throws an error if channel name is too long", () => {
    const longChannelName = "a".repeat(64);
    expect(() => new PubSub<number>(longChannelName)).toThrow();
  });

  it("sets up the pg-listen subscription on construction", () => {
    expect(fakeSubscriberInstance.notifications.on).toHaveBeenCalledWith(
      "test-channel",
      expect.any(Function),
    );
    expect(fakeSubscriberInstance.listenTo).toHaveBeenCalledWith(
      "test-channel",
    );
  });

  it("publishes small messages directly using pg-listen.notify", async () => {
    await pubsub.publish(42);
    expect(fakeSubscriberInstance.notify).toHaveBeenCalledWith(
      "test-channel",
      superjson.stringify(42),
    );
    expect(cache).not.toHaveBeenCalled();
  });

  // src/server/db/pubsub/pubsub.test.ts

  it("uses cache service for large payloads impl 1", async () => {
    // Mock the stringified payload size to exceed the limit
    const mockStringify = vi.spyOn(superjson, "stringify");

    // First call will return a large string (for size check)
    // Second call will return the normal stringified cache reference
    mockStringify
      .mockImplementationOnce(() => "x".repeat(8000)) // Exceed the MAX_DIRECT_PAYLOAD_SIZE
      .mockImplementationOnce((val) => JSON.stringify(val));

    // Create a payload
    const largePayload = 42000;

    await pubsub.publish(largePayload);

    expect(cache).toHaveBeenCalledWith({
      value: largePayload,
      durationSeconds: 3600,
    });

    expect(fakeSubscriberInstance.notify).toHaveBeenCalledWith(
      "test-channel",
      expect.any(String), // We can't predict the exact string due to our mock
    );

    // Restore the original implementation
    mockStringify.mockRestore();
  });

  it("uses cache service for large payloads impl 2", async () => {
    // Create a large payload that would exceed the size limit
    // A string of 8000+ characters will definitely exceed the limit after stringification
    const largePayload = "x".repeat(8000);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await pubsub.publish(largePayload as any);

    expect(cache).toHaveBeenCalledWith({
      value: largePayload,
      durationSeconds: 3600,
    });

    expect(fakeSubscriberInstance.notify).toHaveBeenCalledWith(
      "test-channel",
      superjson.stringify({ __cacheRef: "cache-id-123" }),
    );
  });

  it("delivers published messages to a subscriber", async () => {
    const gen = pubsub.subscribe();

    // Retrieve the callback registered for the channel.
    const onCalls = fakeSubscriberInstance.notifications.on.mock.calls;
    const callbackCall = onCalls.find((call) => call[0] === "test-channel");
    if (!callbackCall) throw new Error("No subscription callback found");
    const callback = callbackCall[1] as (payload: string) => void;

    // Simulate an incoming notification.
    callback(superjson.stringify(100));
    const result = await gen.next();
    expect(result.value).toBe(100);
    expect(result.done).toBe(false);
  });

  it("handles cache references in notifications", async () => {
    const gen = pubsub.subscribe();

    // Retrieve the callback registered for the channel.
    const onCalls = fakeSubscriberInstance.notifications.on.mock.calls;
    const callbackCall = onCalls.find((call) => call[0] === "test-channel");
    if (!callbackCall) throw new Error("No subscription callback found");
    const callback = callbackCall[1] as (payload: string) => void;

    // Simulate an incoming notification with a cache reference.
    callback(superjson.stringify({ __cacheRef: "cache-id-123" }));

    // Should retrieve from cache
    expect(getCache).toHaveBeenCalledWith({ id: "cache-id-123" });

    const result = await gen.next();
    expect(result.value).toBe(42000); // The value from our mocked getCache
    expect(result.done).toBe(false);
  });

  it("delivers messages to multiple subscribers", async () => {
    const gen1 = pubsub.subscribe();
    const gen2 = pubsub.subscribe();

    const onCalls = fakeSubscriberInstance.notifications.on.mock.calls;
    const callbackCall = onCalls.find((call) => call[0] === "test-channel");
    if (!callbackCall) throw new Error("No subscription callback found");
    const callback = callbackCall[1] as (payload: string) => void;

    // Send two notifications.
    callback(superjson.stringify(1));
    callback(superjson.stringify(2));

    const res1a = await gen1.next();
    const res2a = await gen2.next();
    expect(res1a.value).toBe(1);
    expect(res2a.value).toBe(1);

    const res1b = await gen1.next();
    const res2b = await gen2.next();
    expect(res1b.value).toBe(2);
    expect(res2b.value).toBe(2);
  });

  it("stops the async generator when return() is called", async () => {
    const gen = pubsub.subscribe();

    const onCalls = fakeSubscriberInstance.notifications.on.mock.calls;
    const callbackCall = onCalls.find((call) => call[0] === "test-channel");
    if (!callbackCall) throw new Error("No subscription callback found");
    const callback = callbackCall[1] as (payload: string) => void;

    callback(superjson.stringify(200));
    const res1 = await gen.next();
    expect(res1.value).toBe(200);

    // Terminate the generator.
    await gen.return?.();
    const res2 = await gen.next();
    expect(res2.done).toBe(true);
  });

  it("does not deliver messages to a subscriber after it has returned", async () => {
    const gen1 = pubsub.subscribe();
    const gen2 = pubsub.subscribe();

    // End the second subscriber.
    await gen2.return?.();

    const onCalls = fakeSubscriberInstance.notifications.on.mock.calls;
    const callbackCall = onCalls.find((call) => call[0] === "test-channel");
    if (!callbackCall) throw new Error("No subscription callback found");
    const callback = callbackCall[1] as (payload: string) => void;
    callback(superjson.stringify(999));

    const res1 = await gen1.next();
    expect(res1.value).toBe(999);
    const res2 = await gen2.next();
    expect(res2.done).toBe(true);
  });
});
