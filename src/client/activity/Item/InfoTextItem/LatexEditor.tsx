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

if (typeof window !== "undefined") {
  window.mathVirtualKeyboard.layouts = ["minimalist"];
}

export function LatexEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<MathfieldElement>(null);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    <math-field ref={ref} onInput={(evt: any) => onChange(evt.target.value)}>
      {value}
    </math-field>
  );
}
