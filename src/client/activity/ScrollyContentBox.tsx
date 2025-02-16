export function ScrollyContentBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`outline-3 flex h-full grow items-center overflow-y-auto rounded-lg outline outline-gray-200 ${className}`}
      style={{ width: `calc(100% - 2px)` }} // to account for the outline
    >
      {children}
    </div>
  );
}
