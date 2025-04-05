// DEPRECATED; use Editor instead
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PreformattedText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <pre className={`text-wrap font-serif ${className}`}>{children}</pre>;
}

export {};
