import { type MaybePromise } from "~/common/types";

export async function debouncePublish(
  gen: AsyncGenerator<string | null>,
  intervalMs: number,
  publishFn: (combinedDelta: string) => MaybePromise<void>,
): Promise<{ streamed: string }> {
  let streamed = "";
  let partial = "";
  let lastPublish = new Date(0);
  for await (const resp of gen) {
    if (typeof resp !== "string") {
      continue;
    }
    streamed += resp;
    partial += resp;
    const now = new Date();
    if (now.getTime() - lastPublish.getTime() > intervalMs) {
      void publishFn(partial);
      lastPublish = now;
      partial = "";
    }
  }
  if (partial.length > 0) {
    void publishFn(partial);
  }

  return { streamed };
}
