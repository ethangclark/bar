import createSubscriber from "pg-listen";
import superjson from "superjson";
import { invoke } from "~/common/fnUtils";
import type { SuperJSONValue } from "~/common/types";
import { env } from "~/env";
import { cache, getCache } from "~/server/services/cacheService";

// PostgreSQL NOTIFY has a payload size limit of 8000 bytes
// We reserve some space for the channel name (max 63 bytes) and overhead
const MAX_DIRECT_PAYLOAD_SIZE = 7900;
const MAX_CHANNEL_NAME_LENGTH = 63;

/**
 * A simple async queue that lets you push items and later await them.
 */
class AsyncQueue<T extends SuperJSONValue> {
  private items: T[] = [];
  private resolvers: Array<(value: T) => void> = [];
  private closed = false;

  push(item: T) {
    if (this.closed) return;
    if (this.resolvers.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const resolve = this.resolvers.shift()!;
      resolve(item);
    } else {
      this.items.push(item);
    }
  }

  close() {
    this.closed = true;
    // Cancel any pending shifts by rejecting them.
    while (this.resolvers.length) {
      // Here we choose to reject the waiting promise.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any
      this.resolvers.shift()!(new Error("Queue closed") as any);
    }
  }

  async shift(): Promise<T> {
    if (this.items.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.items.shift()!;
    }
    if (this.closed) {
      return Promise.reject(new Error("Queue closed"));
    }
    return new Promise<T>((resolve) => {
      this.resolvers.push(resolve);
    });
  }
}

type Subscriber<T> = {
  push: (data: T) => void;
  close: () => void;
};

// Type for cache reference payload
type CacheRefPayload = {
  __cacheRef: string;
};

// Helper to check if a payload is a cache reference
function isCacheRef(payload: unknown): payload is CacheRefPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "__cacheRef" in payload &&
    typeof (payload as CacheRefPayload).__cacheRef === "string"
  );
}

export class PubSub<T extends SuperJSONValue> {
  private pglSubscriber: ReturnType<typeof createSubscriber>;
  private subscribers = new Set<Subscriber<T>>();

  constructor(private channel: string) {
    if (channel.length > MAX_CHANNEL_NAME_LENGTH) {
      throw new Error(
        `Channel name exceeds maximum length of ${MAX_CHANNEL_NAME_LENGTH} bytes`,
      );
    }

    this.pglSubscriber = createSubscriber({
      connectionString: env.DATABASE_URL,
    });

    // When a notification comes in on our channel, handle it
    this.pglSubscriber.notifications.on(channel, (payload: string) => {
      void invoke(async () => {
        try {
          const parsedPayload = superjson.parse(payload);

          // Check if this is a cache reference
          if (isCacheRef(parsedPayload)) {
            // Retrieve the actual payload from cache
            const actualPayload = await getCache({
              id: parsedPayload.__cacheRef,
            });
            this.broadcast(actualPayload as T);
          } else {
            // Direct payload
            this.broadcast(parsedPayload as T);
          }
        } catch (error) {
          console.error("Error processing pubsub notification:", error);
        }
      });
    });

    // Connect and start listening.
    void this.pglSubscriber.connect().then(() => {
      return this.pglSubscriber.listenTo(channel);
    });
  }

  async publish(payload: T): Promise<void> {
    const stringified = superjson.stringify(payload);

    // If payload is small enough, send directly
    if (stringified.length <= MAX_DIRECT_PAYLOAD_SIZE) {
      await this.pglSubscriber.notify(this.channel, stringified);
      return;
    }

    // For large payloads, store in cache and send a reference
    const cacheEntry = await cache({
      value: payload,
      durationSeconds: 3600, // Cache for 1 hour
    });

    const cacheRef: CacheRefPayload = { __cacheRef: cacheEntry.id };
    await this.pglSubscriber.notify(
      this.channel,
      superjson.stringify(cacheRef),
    );
  }

  private broadcast(payload: T) {
    for (const sub of this.subscribers) {
      sub.push(payload);
    }
  }

  subscribe(): AsyncGenerator<T, void, undefined> {
    // Create an async queue for this subscription.
    const queue = new AsyncQueue<T>();

    const mySub = {
      push: (data: T) => queue.push(data),
      close: () => queue.close(),
    };

    // Add to our set so that broadcast will push notifications.
    this.subscribers.add(mySub);
    const self = this;

    // Create an async generator that yields values from the queue.
    async function* gen() {
      try {
        while (true) {
          let value: T;
          try {
            value = await queue.shift();
          } catch (e) {
            // The queue was closed.
            break;
          }
          yield value;
        }
      } finally {
        self.subscribers.delete(mySub);
      }
    }
    const iterator = gen();

    // Wrap the iterator so that if the consumer calls return(),
    // we close our queue (which cancels any pending shifts).
    return {
      next: iterator.next.bind(iterator),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return: async (value?: any) => {
        mySub.close();
        if (iterator.return) {
          return await iterator.return(value);
        }
        return { done: true, value: undefined };
      },
      [Symbol.asyncIterator]() {
        return this;
      },
      throw: async (e: unknown) => {
        mySub.close();
        if (iterator.throw) {
          return await iterator.throw(e);
        }
        return { done: true, value: undefined };
      },
    };
  }
}
