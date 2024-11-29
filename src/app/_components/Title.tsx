export function Title({
  children,
  marginBottomCn = "mb-12",
  mellow = false,
}: {
  children: React.ReactNode;
  marginBottomCn?: string;
  mellow?: boolean;
}) {
  return (
    <h1
      className={`${mellow ? "text-4xl font-semibold" : "text-5xl font-bold"} tracking-tight  ${marginBottomCn}`}
    >
      {children}
    </h1>
  );
}
