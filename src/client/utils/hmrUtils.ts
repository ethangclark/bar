const cbs = Array<() => void>();

const m = module as {
  hot?: {
    // accept: (callback: () => void) => void;
    dispose: (callback: () => void) => void;
    // addStatusHandler: (callback: (status: string) => void) => void;
  };
};
if (m.hot) {
  m.hot.dispose(() => {
    console.log("HMR dispose CB configured");
    setTimeout(() => {
      cbs.forEach((cb) => cb());
    }, 1000);
  });
} else {
  console.log("HMR: none");
}

export function registerHmrCb(cb: () => void) {
  cbs.push(cb);
}
