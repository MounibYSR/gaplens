export function ProgressDotsRow({ progressIndex, total }: { progressIndex: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: i === progressIndex ? "22px" : "8px",
            background: i <= progressIndex ? "var(--teal-2)" : "var(--border-g)",
            opacity: i < progressIndex ? 0.45 : 1,
          }}
        />
      ))}
    </div>
  );
}
