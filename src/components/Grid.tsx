export function Grid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex w-full ${className ?? ""}`}>{children}</div>;
}

export function Col({
  span = 1,
  children,
  className,
}: {
  span?: number;
  children?: React.ReactNode;
  className?: string;
}) {
  const width = `${(span / 12) * 100}%`;

  return (
    <div
      className={className}
      style={{ flex: `0 0 ${width}`, maxWidth: width }}
    >
      {children}
    </div>
  );
}
