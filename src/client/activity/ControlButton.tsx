import { Button, type ButtonProps } from "antd";

export function ControlButton(props: ButtonProps) {
  return <Button {...props} className={`w-full ${props.className ?? ""}`} />;
}
