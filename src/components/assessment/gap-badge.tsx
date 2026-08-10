export function GapBadge({ gap }: { gap: number }) {
  const color = gap >= 67 ? "var(--gap)" : gap >= 34 ? "var(--gold)" : "var(--healthy)";

  return (
    <div
      key={gap}
      className="ltr-num inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-bold"
      style={{ borderColor: color, color, animation: "badge-pop 0.25s ease-out" }}
      dir="ltr"
    >
      Gap {gap}
    </div>
  );
}
