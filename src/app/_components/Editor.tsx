"use client";

import { type KeyboardEventHandler } from "react";
import Textarea from "react-expanding-textarea";

export const Editor = ({
  value,
  setValue,
  width = "100%", // 516,
  placeholder = "Type here...",
  minHeight = 64 /* smaller than this causes a bounce on load */,
  onKeyDown,
  disabled,
  className,
}: {
  value: string;
  setValue: (value: string) => void;
  width?: number | string;
  placeholder?: string;
  minHeight?: number;
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
  disabled?: boolean;
  className?: string;
}) => {
  return (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      style={{
        width,
        resize: "none",
        minHeight,
      }}
      onKeyDown={onKeyDown}
      disabled={disabled}
      className={`rounded p-2 outline outline-1 outline-gray-200 focus:outline focus:outline-gray-200 ${className ?? ""}`}
      placeholder={placeholder}
    />
  );
};
