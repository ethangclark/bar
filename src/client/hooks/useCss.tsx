import { useLayoutEffect, useMemo, useState } from "react";
import { noop } from "~/common/fnUtils";

export function injectCss(css: string) {
  if (typeof document === "undefined") {
    return noop;
  }
  const style = document.createElement("style");
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
  return () => {
    document.head.removeChild(style);
  };
}

export function useCss(createCss: (id: string) => string) {
  const [id] = useState(() => Math.random().toString(36).slice(2));

  useLayoutEffect(() => {
    const remove = injectCss(createCss(id));
    return remove;
  }, [createCss, id]);

  return useMemo(() => ({ id }), [id]);
}
