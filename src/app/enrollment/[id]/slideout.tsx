import { Drawer } from "antd";
import { useState, type ReactNode, useCallback } from "react";

export function Slideout({
  trigger,
  children,
  triggerClassName = "",
  slideoutClassName = "",
  width = undefined,
}: {
  trigger: ReactNode;
  children: ReactNode;
  triggerClassName?: string;
  slideoutClassName?: string;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const toggleOpen = useCallback(() => setOpen((prev) => !prev), []);
  return (
    <>
      <div
        onClick={toggleOpen}
        className={`${triggerClassName} hover:cursor-pointer`}
      >
        {trigger}
      </div>
      <Drawer
        open={open}
        onClose={toggleOpen}
        placement="left"
        width={width}
        className={slideoutClassName}
      >
        {children}
      </Drawer>
    </>
  );
}
