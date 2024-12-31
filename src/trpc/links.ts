import {
  loggerLink,
  splitLink,
  unstable_httpSubscriptionLink,
  unstable_httpBatchStreamLink,
  // httpLink,
} from "@trpc/client";
import SuperJSON from "superjson";
import { getTrpcUrl } from "~/common/utils/urlUtils";

const linkOpts = {
  transformer: SuperJSON,
  url: getTrpcUrl(),
  headers: () => {
    const headers = new Headers();
    headers.set("x-trpc-source", "nextjs-react");
    return headers;
  },
} as const;

export const links = [
  loggerLink({
    // enabled: () => false,
    enabled: (op) =>
      process.env.NODE_ENV === "development" ||
      (op.direction === "down" && op.result instanceof Error),
  }),
  splitLink({
    // uses the httpSubscriptionLink for subscriptions
    condition: (op) => op.type === "subscription",
    true: unstable_httpSubscriptionLink(linkOpts),
    false: unstable_httpBatchStreamLink(linkOpts),
    // false: httpLink(linkOpts),
  }),
];
