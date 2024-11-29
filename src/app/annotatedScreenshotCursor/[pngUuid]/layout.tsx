export default function MyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="absolute left-0 top-0"
      style={{ minWidth: "100vw", minHeight: "100vh" }}
    >
      {children}
    </div>
  );
}
