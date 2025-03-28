import { Typography } from "antd";
import { default as NextLink } from "next/link";

export const LinkX = ({
  children,
  ...props
}: React.ComponentProps<typeof NextLink>) => (
  <NextLink {...props}>
    <Typography.Link>{children}</Typography.Link>
  </NextLink>
);

export const LinkStyle = ({
  children,
  ...props
}: Exclude<React.ComponentProps<typeof Typography.Link>, "href">) => (
  <Typography.Link {...props}>{children}</Typography.Link>
);
