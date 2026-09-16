export function GapBadge({ gap }: { gap: number }) {
  const borderColor = gap >= 67 ? "var(--gap)" : gap >= 34 ? "var(--gold)" : "var(--healthy)";
  // Border/badge fill keep the exact brand gold; text gets the light-mode-safe
  // variant so a medium-gap gold badge's own label stays readable on white.
  const textColor = gap >= 67 ? "var(--gap)" : gap >= 34 ? "var(--text-gold-light-mode)" : "var(--healthy)";

  return (
    <div
      key={gap}
      className="ltr-num inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-bold"
      style={{ borderColor, color: textColor, animation: "badge-pop 0.25s ease-out" }}
      dir="ltr"
    >
      Gap {gap}
    </div>
  );
}
