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

export const FullFramedTeacherSection = ({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) => (
  <div className={`h-full w-full ${className ?? ""}`}>
    <TeacherSection className={innerClassName}>{children}</TeacherSection>
  </div>
);
