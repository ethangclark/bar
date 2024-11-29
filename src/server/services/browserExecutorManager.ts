import { type BrowserExecutor } from "../executors/browserExecutor";
import * as uuid from "uuid";

const browserExecutors = new Map<string, BrowserExecutor>();

export async function destroyManagedBrowserExecutor(id: string) {
  const executor = browserExecutors.get(id);
  if (executor) {
    await executor._destroy();
    browserExecutors.delete(id);
  }
}

async function purgeManagedBrowserExecutors() {
  await Promise.all(
    [...browserExecutors.keys()].map((id) => destroyManagedBrowserExecutor(id)),
  );
}

export async function manageBrowserExecutor(browserExecutor: BrowserExecutor) {
  const id = uuid.v4();

  // a hack since we're PoCing
  await purgeManagedBrowserExecutors();

  browserExecutors.set(id, browserExecutor);
  return id;
}

export function getManagedBrowserExecutor(id: string) {
  return browserExecutors.get(id);
}
