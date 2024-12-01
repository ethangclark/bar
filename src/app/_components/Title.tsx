import { Typography } from "antd";

export function Title({
  children,
  className = "",
  marginBottomCn = "mb-12",
}: {
  children: React.ReactNode;
  className?: string;
  marginBottomCn?: string;
}) {
  return (
    <Typography.Title level={1} className={`${className} ${marginBottomCn}`}>
      {children}
    </Typography.Title>
  );
}
