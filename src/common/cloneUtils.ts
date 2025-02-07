import superjson from "superjson";
import type { SuperJSONValue } from "./types";

export function clone<T extends SuperJSONValue>(json: T): T {
  return superjson.deserialize<T>(superjson.serialize(json));
}
