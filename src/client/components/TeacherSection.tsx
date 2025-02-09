export const TeacherSection = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-lg border-2 border-dotted border-blue-500 p-1 ${className ?? ""}`}
  >
    {children}
  </div>
);
