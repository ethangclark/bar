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
  paddingCn?: string;
  roundingCn?: string;
  outlineCn?: string;
};

export const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(
  function Editor(
    {
      value,
      setValue,
      width = "100%", // 516,
      placeholder = "Type here...",
      minHeight = 32 /* smaller than this causes a bounce on load */,
      onKeyDown,
      disabled,
      className,
      height,
      paddingCn = "p-2",
      roundingCn = "rounded-md",
      outlineCn = "outline outline-1 outline-gray-200 focus:outline focus:outline-gray-200",
    },
    ref,
  ) {
    console.log({ outlineCn });
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
        }}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className={`${paddingCn} ${roundingCn} ${outlineCn} ${className ?? ""}`}
        placeholder={placeholder}
      />
    );
  },
);

export function WysiwygEditor({
  value,
  setValue,
  placeholder,
  disabled = false,
  outlineCn = "focus:outline focus:outline-gray-200",
  roundingCn = "rounded-none",
  className = "",
  width,
}: {
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  outlineCn?: string;
  roundingCn?: string;
  className?: string;
  width?: number;
}) {
  return (
    <Editor
      placeholder={placeholder}
      value={value}
      setValue={setValue}
      paddingCn="p-1"
      className={`mx-[-4px] grow disabled:cursor-auto disabled:bg-white ${className}`}
      roundingCn={roundingCn}
      outlineCn={outlineCn}
      disabled={disabled}
      width={width}
    />
  );
}
