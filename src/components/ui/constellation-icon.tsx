/**
 * GapLens's own "AI" mark — a hub with 3 branches, echoing the GapFix
 * hub-and-branches shape from the particle explainer (lens/nodes/arrow/fix)
 * and the Tool Map's hub-and-spoke layout. Stands in for generic sparkle/
 * star-burst "AI" glyphs used everywhere else in the industry.
 */
export function ConstellationIcon({ size = 12, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 12 12 3M12 12l7.8 4.5M12 12l-7.8 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
      <circle cx="12" cy="3" r="1.8" fill="currentColor" />
      <circle cx="19.8" cy="16.5" r="1.8" fill="currentColor" />
      <circle cx="4.2" cy="16.5" r="1.8" fill="currentColor" />
    </svg>
  );
}
