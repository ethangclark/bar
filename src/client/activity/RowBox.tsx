const boxWidth = 400;

export function RowBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center p-4" style={{ width: boxWidth }}>
      {children}
    </div>
  );
}
