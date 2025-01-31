import superjson from "superjson";

type SuperJSONValue = Parameters<typeof superjson.serialize>[0];

export function clone<T extends SuperJSONValue>(json: T): T {
  return superjson.deserialize<T>(superjson.serialize(json));
}
