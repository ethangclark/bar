import superjson from "superjson";
import type { SuperJsonValue } from "./types";

export function clone<T extends SuperJsonValue>(json: T): T {
  return superjson.deserialize<T>(superjson.serialize(json));
}
