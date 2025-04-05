export function PreformattedText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <pre className={`text-wrap font-serif ${className}`}>{children}</pre>;
}
