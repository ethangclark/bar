import { useLayoutEffect, useRef, useState } from "react";

export function useCss(createCss: (id: string) => string) {
  const [id] = useState(() => Math.random().toString(36).slice(2));

  const styleRef = useRef<HTMLStyleElement | null>(null);

  useLayoutEffect(() => {
    styleRef.current = document.createElement("style");
    const style = styleRef.current;
    style.appendChild(document.createTextNode(createCss(id)));
    document.head.appendChild(styleRef.current);
    return () => {
      document.head.removeChild(style);
    };
  }, [createCss, id]);

  return { id };
}
