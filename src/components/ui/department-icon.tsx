import type { DepartmentDef } from "@/lib/assessment/departments";

/**
 * Renders a department's fixed icon shape — pairs with its accent color so
 * identity doesn't depend on hue alone (several accents sit close in
 * luminance to each other; the shape carries the difference the color
 * can't for colorblind users).
 */
export function DepartmentIcon({
  department,
  size = 14,
  className,
}: {
  department: Pick<DepartmentDef, "icon">;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={department.icon} />
    </svg>
  );
}
