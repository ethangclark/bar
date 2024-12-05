export function PreformattedText({ children }: { children: React.ReactNode }) {
  return <pre className="text-wrap font-serif">{children}</pre>;
}
