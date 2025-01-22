"use client";

import { forwardRef, type KeyboardEventHandler } from "react";
import ExpandingTextarea, {
  type TextareaProps,
} from "react-expanding-textarea";

const FixedTextArea = forwardRef<
  HTMLTextAreaElement,
  Omit<TextareaProps, "rows">
>(function FixedTextArea(props, ref) {
  return <textarea {...props} ref={ref} />;
});

type EditorProps = {
  value: string;
  setValue: (value: string) => void;
  width?: number | string;
  placeholder?: string;
  minHeight?: number;
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
  disabled?: boolean;
  className?: string;
  height?: number;
  flexGrow?: number;
};

export const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(
  function Editor(
    {
      value,
      setValue,
      width = "100%", // 516,
      placeholder = "Type here...",
      minHeight = 64 /* smaller than this causes a bounce on load */,
      onKeyDown,
      disabled,
      className,
      height,
      flexGrow,
    },
    ref,
  ) {
    const Component = height ? FixedTextArea : ExpandingTextarea;
    return (
      <Component
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          width,
          resize: "none",
          minHeight,
          height,
          flexGrow,
        }}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className={`rounded-md p-2 outline outline-1 outline-gray-200 focus:outline focus:outline-gray-200 ${className ?? ""}`}
        placeholder={placeholder}
      />
    );
  },
);
