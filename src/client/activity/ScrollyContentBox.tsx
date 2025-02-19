export function ScrollyContentBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full grow flex-col items-center overflow-y-auto rounded-lg outline outline-1 outline-gray-200 ${className}`}
      style={{ width: `calc(100% - 2px)` }} // to account for the outline
    >
      {children}
    </div>
  );
}
