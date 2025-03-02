// this file exists to avoid a circular dependency between trpc and client/utils/errorUtils

const queue = new Set<Error>();
const errorSubscribers = new Set<(error: Error) => void>();

function drainIfAppropriate() {
  if (errorSubscribers.size === 0) {
    return;
  }
  queue.forEach((error) => {
    errorSubscribers.forEach((subscriber) => {
      subscriber(error);
    });
  });
  queue.clear();
}

export function reportTrpcError(error: Error) {
  queue.add(error);
  drainIfAppropriate();
}

export function subscribeToTrpcErrors(subscriber: (error: Error) => void) {
  errorSubscribers.add(subscriber);
  drainIfAppropriate();
  return () => {
    errorSubscribers.delete(subscriber);
  };
}
