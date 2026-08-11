import { DEPARTMENTS } from "@/lib/assessment/departments";
import type { Department } from "@/lib/supabase/types";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";

const SIZE = 220;
const CENTER = SIZE / 2;
const MAX_R = SIZE / 2 - 34;
const RINGS = [0.33, 0.66, 1];

function pointAt(index: number, total: number, ratio: number) {
  const angle = -Math.PI / 2 + (index / total) * 2 * Math.PI;
  return {
    x: CENTER + Math.cos(angle) * MAX_R * ratio,
    y: CENTER + Math.sin(angle) * MAX_R * ratio,
  };
}

function dotColor(pct: number) {
  if (pct >= 70) return "var(--healthy)";
  if (pct >= 30) return "var(--gold)";
  return "var(--gap)";
}

export function DepartmentRadar({
  coverage,
  lang,
}: {
  coverage: { key: Department; pct: number }[];
  lang: EntryLang;
}) {
  const total = DEPARTMENTS.length;
  const dataPoints = DEPARTMENTS.map((dept, i) => {
    const pct = coverage.find((c) => c.key === dept.key)?.pct ?? 0;
    return { dept, pct, ...pointAt(i, total, Math.max(pct / 100, 0.05)) };
  });
  const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto overflow-visible">
      {RINGS.map((ratio) => {
        const ringPoints = DEPARTMENTS.map((_, i) => {
          const p = pointAt(i, total, ratio);
          return `${p.x},${p.y}`;
        }).join(" ");
        return <polygon key={ratio} points={ringPoints} fill="none" stroke="var(--border-g)" strokeWidth="1" />;
      })}

      {DEPARTMENTS.map((_, i) => {
        const edge = pointAt(i, total, 1);
        return <line key={i} x1={CENTER} y1={CENTER} x2={edge.x} y2={edge.y} stroke="var(--border-g)" strokeWidth="1" />;
      })}

      <polygon points={polygonPoints} fill="rgba(21, 201, 154, 0.15)" stroke="var(--teal-2)" strokeWidth="1.5" />

      {dataPoints.map((p) => (
        <circle key={p.dept.key} cx={p.x} cy={p.y} r="3" fill={dotColor(p.pct)} />
      ))}

      {DEPARTMENTS.map((dept, i) => {
        const labelPoint = pointAt(i, total, 1.22);
        return (
          <text
            key={dept.key}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--muted)"
            fontFamily="var(--font-mono-console)"
            fontSize="7"
            style={{ textTransform: "uppercase", letterSpacing: "0.03em" }}
          >
            {dept.title[lang]}
          </text>
        );
      })}
    </svg>
  );
}
