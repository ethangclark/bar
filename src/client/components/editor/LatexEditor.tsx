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
import { useEffect, useRef } from "react";
import { injectCss } from "~/client/hooks/useCss";

/*
To regenerate the base of this to extend, run the following:

window.mathVirtualKeyboard.layouts = ["minimalist"];
console.log(JSON.stringify(window.mathVirtualKeyboard.normalizedLayouts));
*/
const layoutLabel = "minimalist-with-subscript";
const layouts = [
  {
    label: layoutLabel,
    layers: [
      {
        style: `
          div.${layoutLabel}-backdrop { /* Updated class name */
            display: flex;
            justify-content: center;
          }
          div.${layoutLabel}-container { /* Updated class name */
            --keycap-height: 40px;
            --keycap-max-width: 53px;
            --keycap-small-font-size: 12px;
            background: var(--keyboard-background);
            padding: 20px 20px 0px 20px;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            border: 1px solid var(--keyboard-border);
            box-shadow: 0 0 32px rgb(0 0 0 / 30%);
          }
        `,
        backdrop: `${layoutLabel}-backdrop`, // Updated class name
        container: `${layoutLabel}-container`, // Updated class name
        rows: [
          [
            // First Row
            {
              latex: "\\times",
            },
            {
              latex: "\\frac{#@}{#0}",
              class: "small",
            },
            // {
            //   variants: ".",
            //   command: "performWithFeedback(insertDecimalSeparator)",
            //   shift: ",",
            //   class: "big-op hide-shift",
            //   label: ".",
            // },
            {
              latex: "\\sqrt{#0}",
              class: "small",
            },
            {
              latex: "^{#?}", // Removed #@ - inserts script structure, cursor goes inside
              class: "small",
              label: `<span class="flex items-center">X<sup class="text-xl">◻</sup></span>`,
            },
            {
              latex: "_{#?}", // Removed #@ - inserts script structure, cursor goes inside
              class: "small",
              label: `<span class="flex items-center">X<sub class="text-xl">◻</sub></span>`,
            },
            {
              latex: "{#@}^{#?}_{#?}", // Base, then superscript placeholder, then subscript placeholder
              class: "small",
              label: `<span class="flex items-center relative -ml-3">X<sup class="text-xl absolute -top-4 left-2">◻</sup><sub class="text-xl absolute top-0.5 left-2">◻</sub></span>`, // Visual label with stacked boxes
            },
            {
              latex: "\\pi",
            },
          ],
          // [
          //   // Second Row
          //   {
          //     latex: "^{#?}#@", // Superscript before
          //     class: "small",
          //     label: `<span class="flex items-center"><sup class="text-xl">◻</sup>X</span>`,
          //   },
          //   {
          //     latex: "_{#?}#@", // Subscript after
          //     class: "small",
          //     label: `<span class="flex items-center"><sub class="text-xl">◻</sub>X</span>`,
          //   },
          //   {
          //     latex: "^{#?}_{#?}#@", // Base, then superscript placeholder, then subscript placeholder
          //     class: "small",
          //     label: `<span class="flex items-center relative -ml-3"><sup class="text-xl absolute -top-4">◻</sup><sub class="text-xl absolute top-0.5">◻</sub>&nbsp;&nbsp;&nbsp;&nbsp;X</span>`, // Visual label with stacked boxes
          //   },
          // ],
          [
            // N-1th Row - Separator
            {
              class: "separator horizontal-rule",
            },
          ],
          [
            // Nth Row - Actions
            {
              class: "ghost if-can-undo",
              command: "undo",
              label: "<svg class=svg-glyph><use xlink:href=#svg-undo /></svg>",
              tooltip: "tooltip.undo",
            },
            {
              class: "ghost  if-can-redo",
              command: "redo",
              label: "<svg class=svg-glyph><use xlink:href=#svg-redo /></svg>",
              tooltip: "tooltip.redo",
            },
            {
              class: "separator",
              width: 0.5 as const,
            },
            {
              latex: "\\ ", // Insert a LaTeX space command
              label: "Space",
              width: 2 as const, // Make the space key wider
            },
            {
              class: "separator",
              width: 0.5 as const,
            },
            {
              class: "action hide-shift",
              label:
                "<svg class=svg-glyph><use xlink:href=#svg-arrow-left /></svg>",
              command: "performWithFeedback(moveToPreviousChar)",
              shift: {
                label:
                  "<svg class=svg-glyph><use xlink:href=#svg-angle-double-left /></svg>",
                command: "performWithFeedback(extendSelectionBackward)",
              },
            },
            {
              class: "action hide-shift",
              label:
                "<svg class=svg-glyph><use xlink:href=#svg-arrow-right /></svg>",
              command: "performWithFeedback(moveToNextChar)",
              shift: {
                label:
                  "<svg class=svg-glyph><use xlink:href=#svg-angle-double-right /></svg>",
                command: "performWithFeedback(extendSelectionForward)",
              },
            },
            {
              class: "action hide-shift",
              width: 1.5 as const,
              command: "performWithFeedback(deleteBackward)",
              label:
                "<svg class=svg-glyph><use xlink:href=#svg-delete-backward /></svg>",
              shift: {
                class: "action warning",
                label:
                  "<svg class=svg-glyph><use xlink:href=#svg-trash /></svg>",
                command: "deleteAll",
              },
            },
            {
              class: "action",
              command: ["hideVirtualKeyboard"],
              width: 1.5 as const,
              label:
                "<svg class=svg-glyph-lg><use xlink:href=#svg-keyboard-down /></svg>",
            },
          ],
        ],
        id: "ML__layer_minimalist_with_subscript", // Updated ID for clarity
      },
    ],
    displayShiftedKeycaps: false,
    displayEditToolbar: false,
  },
];

if (typeof window !== "undefined") {
  window.mathVirtualKeyboard.layouts = layouts;
  injectCss(`
    .${layoutLabel}-backdrop {
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
  placeholder,
  onKeyDown,
  readOnly,
}: {
  value: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  onKeyDown?: (e: {
    key: string;
    shiftKey: boolean;
    preventDefault: () => void;
  }) => void;
  readOnly?: boolean;

  // TODO: there's a bug in mathlive; we need to find another means of disabling it.
  // (Currently we're not using this prop.)
  disabled?: boolean;
}) {
  const ref = useRef<MathfieldElement>(null);

  // Effect to update mathVirtualKeyboard configuration if needed,
  // though setting it outside the component like you did is often sufficient
  // for static configurations.
  // useEffect(() => {
  //   if (ref.current) {
  //     ref.current.mathVirtualKeyboardPolicy = "manual"; // Or 'auto'
  //     ref.current.setOptions({
  //       virtualKeyboardLayouts: layouts, // Pass the layouts object directly if needed dynamically
  //       virtualKeyboardMode: "manual", // Or 'onfocus'
  //     });
  //   }
  // }, []); // Runs once on mount

  useEffect(() => {
    if (ref.current?.shadowRoot) {
      const remove = injectCss(
        `
        [data-tooltip]::after {
          content: "" !important;
          display: none !important;
        }
        `,
        ref.current.shadowRoot,
      );
      return () => remove();
    }
  }, []);

  return (
    <math-field
      ref={ref}
      // @ts-expect-error The impl is weird ok?
      class={className}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      onInput={(evt: any) => onChange?.(evt.target.value)}
      placeholder={placeholder?.replace(/ /g, "\\ ")}
      onKeyDown={onKeyDown}
      // // The virtual keyboard configuration is often better set globally
      // // or via attributes/properties as MathLive expects.
      // // Setting options like this might be necessary depending on setup.
      // // It's also common to set `mathVirtualKeyboardLayouts` directly.
      // math-virtual-keyboard-layouts={layoutLabel} // Reference the custom layout label
      // math-virtual-keyboard-mode="manual" // Or "onfocus" / "off" depending on how you want to trigger it

      // There's a bug in mathlive; `readonly` works fine, but `disabled` disables all instances
      // disabled={disabled}
      readOnly={readOnly}
    >
      {value}
    </math-field>
  );
}
