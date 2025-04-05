declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<
        React.HTMLAttributes<MathfieldElement>,
        MathfieldElement
      >;
    }
  }
}

import "mathlive";
import { type MathfieldElement } from "mathlive";
import "mathlive/fonts.css";
import { useRef } from "react";
import { injectCss } from "~/client/hooks/useCss";

if (typeof window !== "undefined") {
  const layout = "minimalist";
  window.mathVirtualKeyboard.layouts = [layout];
  injectCss(`
    .${layout}-backdrop {
      background: white;
    }
    math-field::part(menu-toggle) {
      display: none;
    }
    math-field:focus-within {
      outline: none;
    }
  `);
}

export function LatexEditor({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const ref = useRef<MathfieldElement>(null);

  return (
    <math-field
      ref={ref}
      // @ts-expect-error The impl is weird ok?
      class={className}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      onInput={(evt: any) => onChange(evt.target.value)}
    >
      {value}
    </math-field>
  );
}
