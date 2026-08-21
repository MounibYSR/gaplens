/**
 * Shared icon set for cost/accuracy/credibility rows — previously redrawn
 * verbatim in 4 separate files (overview-section, gauge, roadmap-section,
 * credibility-section). One source now; IconBadge gives every usage the
 * same colored-tile treatment DepartmentIcon-adjacent components already
 * use, instead of a bare stroke glyph floating in a text row.
 */

function IconSvg({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function ClockIcon({ size = 16 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </IconSvg>
  );
}

export function PersonIcon({ size = 16 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </IconSvg>
  );
}

export function InfoIcon({ size = 16 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </IconSvg>
  );
}

export function TeamIcon({ size = 18 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </IconSvg>
  );
}

export function MonitorIcon({ size = 18 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
    </IconSvg>
  );
}

export function CohortIcon({ size = 18 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
    </IconSvg>
  );
}

export function MinistryIcon({ size = 18 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <path d="M12 2 3 7v2h18V7l-9-5Z" />
      <path d="M5 10v9M9 10v9M15 10v9M19 10v9M3 21h18" />
    </IconSvg>
  );
}

export function LocationIcon({ size = 18 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </IconSvg>
  );
}

export function LockIcon({ size = 18 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </IconSvg>
  );
}

export function DocumentIcon({ size = 16 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </IconSvg>
  );
}

/** Colored-tile wrapper — gives a bare stroke icon the same "icon-in-a-tile"
 * treatment across cost rows, accuracy rows, and credibility cards instead
 * of each screen floating the glyph directly in a text row. */
export function IconBadge({
  icon,
  color = "var(--teal-2)",
  sizeClass = "h-8 w-8",
}: {
  icon: React.ReactNode;
  color?: string;
  sizeClass?: string;
}) {
  return (
    <span
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-lg`}
      style={{ background: "var(--glass-2)", color }}
    >
      {icon}
    </span>
  );
}
