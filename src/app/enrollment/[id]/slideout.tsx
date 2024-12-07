import { Drawer } from "antd";
import { useState, type ReactNode, useCallback } from "react";

export function Slideout({
  trigger,
  children,
  className = "",
  width = undefined,
}: {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const toggleOpen = useCallback(() => setOpen((prev) => !prev), []);
  return (
    <>
      <div onClick={toggleOpen} className={`${className} hover:cursor-pointer`}>
        {trigger}
      </div>
      <Drawer open={open} onClose={toggleOpen} placement="left" width={width}>
        {children}
      </Drawer>
    </>
  );
}
