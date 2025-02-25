import createSubscriber from "pg-listen";
import superjson from "superjson";
import type { SuperJSONValue } from "~/common/types";
import { env } from "~/env";

type Subscriber<T> = {
  push: (data: T) => void;
  close: () => void;
};

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

/**
 * Cache the subscribers in development. This avoids creating a new subscriber on every HMR
 * update.
 */
const globalForSubscribers = globalThis as unknown as {
  subscribers?: {
    [key: string]: ReturnType<typeof createSubscriber> | undefined;
  };
};

export class PubSub<T extends SuperJSONValue> {
  private subscriber: ReturnType<typeof createSubscriber>;
  private subscribers = new Set<Subscriber<T>>();

  constructor(private channel: string) {
    globalForSubscribers.subscribers ??= {};
    this.subscriber =
      globalForSubscribers.subscribers?.[channel] ??
      createSubscriber({
        connectionString: env.DATABASE_URL,
      });
    if (env.NODE_ENV !== "production" && env.TEST_TYPE !== "prompt_test") {
      globalForSubscribers.subscribers[`${env.DATABASE_URL}-${channel}`] =
        this.subscriber;
    }

    // When a notification comes in on our channel, broadcast it.
    this.subscriber.notifications.on(channel, (payload: string) => {
      this.broadcast(superjson.parse<T>(payload));
    });
    // Connect and start listening.
    void this.subscriber.connect().then(() => {
      return this.subscriber.listenTo(channel);
    });
  }

  async publish(payload: T): Promise<void> {
    await this.subscriber.notify(this.channel, superjson.stringify(payload));
  }

  private broadcast(payload: T) {
    for (const sub of this.subscribers) {
      sub.push(payload);
    }
  }

  subscribe(): AsyncGenerator<T, void, undefined> {
    // Create an async queue for this subscription.
    const queue = new AsyncQueue<T>();

    const mySub: Subscriber<T> = {
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
