export function ConsoleLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      dir="ltr"
      className="ltr-num text-xs tracking-widest text-muted"
    >
      {children}
    </span>
  );
}
