import {
  loggerLink,
  splitLink,
  unstable_httpBatchStreamLink,
  unstable_httpSubscriptionLink,
} from "@trpc/client";
// httpLink,
import { type TRPCLink } from "@trpc/client";
import { type AnyRouter } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import SuperJSON from "superjson";
import { getTrpcUrl } from "~/common/urlUtils";
import { reportTrpcError } from "./trpcErrorBridge";

const linkOpts = {
  transformer: SuperJSON,
  url: getTrpcUrl(),
  headers: () => {
    const headers = new Headers();
    headers.set("x-trpc-source", "nextjs-react");
    return headers;
  },
} as const;

const errorSubscribers = new Set<{
  onError: (error: Error) => void;
}>();
export function subscribeToErrors(subscriber: {
  onError: (error: Error) => void;
}) {
  errorSubscribers.add(subscriber);
  return () => {
    errorSubscribers.delete(subscriber);
  };
}

// Custom error alert link
const globalTrpcErrorLink: TRPCLink<AnyRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next(result) {
          observer.next(result);
        },
        error(err) {
          reportTrpcError(err);
          errorSubscribers.forEach((subscriber) => {
            subscriber.onError(err);
          });
          observer.error(err);
        },
        complete() {
          observer.complete();
        },
      });

      return unsubscribe;
    });
  };
};

export const links = [
  loggerLink({
    // enabled: () => false,
    enabled: (op) =>
      process.env.NODE_ENV === "development" ||
      (op.direction === "down" && op.result instanceof Error),
  }),
  globalTrpcErrorLink,
  splitLink({
    // uses the httpSubscriptionLink for subscriptions
    condition: (op) => op.type === "subscription",
    true: unstable_httpSubscriptionLink(linkOpts),
    false: unstable_httpBatchStreamLink(linkOpts),
    // false: httpLink(linkOpts),
  }),
];
