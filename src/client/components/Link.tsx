import { Typography } from "antd";
import { default as NextLink } from "next/link";

export const LinkX = ({
  children,
  href,
  ...props
}: Omit<React.ComponentProps<typeof Typography.Link>, "href"> & {
  href: string;
}) => (
  <NextLink legacyBehavior passHref href={href}>
    <Typography.Link {...props}>{children}</Typography.Link>
  </NextLink>
);

export const LinkStyle = ({
  children,
  ...props
}: Exclude<React.ComponentProps<typeof Typography.Link>, "href">) => (
  <Typography.Link {...props}>{children}</Typography.Link>
);
