import { Button } from "antd";
import { type KeyboardEventHandler } from "react";
import { type MaybePromise } from "~/common/types";

export function EditorTextButton({
  children,
  onKeyDown,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  onClick: () => MaybePromise<void>;
  disabled?: boolean;
}) {
  return (
    <Button
      size="small"
      type="text"
      className="text-xs text-gray-600"
      onClick={onClick}
      onKeyDown={onKeyDown}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
