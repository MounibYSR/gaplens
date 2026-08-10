import { DEPARTMENTS } from "@/lib/assessment/departments";

export function ProgressDots({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="mb-4 flex items-center justify-center gap-2">
      {DEPARTMENTS.map((d, i) => (
        <span
          key={d.key}
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: i === currentIndex ? "22px" : "8px",
            background: i <= currentIndex ? d.accent : "var(--border-g)",
            opacity: i < currentIndex ? 0.45 : 1,
          }}
        />
      ))}
    </div>
  );
}
