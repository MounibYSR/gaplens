import { DEPARTMENTS } from "@/lib/assessment/departments";
import type { Department, GapFixPath, GapPriority, GapStatus } from "@/lib/supabase/types";
import type { RoadmapGap } from "./build-prompt";

export type RoadmapPdfData = {
  roadmap_version: number;
  generated_at: string;
  company_name: string;
  company_logo_data_uri?: string | null;
  confidence_percent: number;
  based_on_departments: Department[];
  gaps: RoadmapGap[];
};

const NAVY = "#0D1220";
const TEAL = "#1D9E75";
const TEAL_LIGHT = "#5DCAA5";
const GOLD = "#E8A020";
const RED = "#D85A30";
const MUTED = "#9aa5b8";
const GREY_LIGHT = "#D1D5DB";
const BORDER = "#E5E7EB";
const BG_LIGHT = "#F7F8FA";
const TEXT_DARK = "#1a1a2e";

const PRIORITY_COLOR: Record<GapPriority, string> = { high: RED, medium: GOLD, low: TEAL };
const PRIORITY_RANK: Record<GapPriority, number> = { high: 3, medium: 2, low: 1 };

const GAPFIX_LABEL: Record<GapFixPath, string> = {
  diy: "Do it yourself",
  vetted_provider: "Refer to a vetted provider",
  gaplens_executes: "GapLens executes this for you",
};

const STATUS_LABEL: Record<GapStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

// Department (by key) -> simple inline line-icon, 24x24 viewBox, stroke=currentColor.
const CATEGORY_ICONS: Record<Department, string> = {
  digital_marketing: `<path d="M3 11v2a2 2 0 0 0 2 2h1l3 4v-6M9 15V7l10-4v18l-10-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  tech_operations: `<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.36.5.6.9.6H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  customer_experience: `<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  data_decision_making: `<path d="M3 3v18h18M8 17V11M13 17V7M18 17v-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  team_readiness: `<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isRtlText(value: string): boolean {
  return /[؀-ۿ]/.test(value);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function departmentByCategory(category: string) {
  return DEPARTMENTS.find((d) => d.title.en === category);
}

function ringGaugeSvg(percent: number): string {
  const size = 160;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference * (1 - clamped / 100);
  return `
    <div class="ring-wrap">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="${stroke}"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${TEAL}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
      </svg>
      <div class="ring-percent">
        <span class="num">${Math.round(clamped)}</span>
        <span class="pct">percent</span>
      </div>
    </div>`;
}

function overviewColumn(dept: (typeof DEPARTMENTS)[number], gaps: RoadmapGap[]): string {
  const deptGaps = gaps.filter((g) => g.category === dept.title.en && g.status !== "resolved");
  const highestPriority = deptGaps.reduce<GapPriority | null>((acc, g) => {
    if (!acc || PRIORITY_RANK[g.priority] > PRIORITY_RANK[acc]) return g.priority;
    return acc;
  }, null);
  const color = highestPriority ? PRIORITY_COLOR[highestPriority] : TEAL;
  const dotCount = Math.min(3, deptGaps.length);
  const dots = Array.from({ length: 3 }, (_, i) =>
    `<span class="dot" style="background:${i < dotCount ? color : GREY_LIGHT}"></span>`,
  ).join("");

  return `
    <div class="overview-col">
      <div class="badge" style="background:${color}">
        <svg width="28" height="28" viewBox="0 0 24 24" style="color:#fff">${CATEGORY_ICONS[dept.key]}</svg>
      </div>
      <div class="badge-label">${escapeHtml(dept.title.en)}</div>
      <div class="dots">${dots}</div>
    </div>`;
}

function gapCard(gap: RoadmapGap, index: number): string {
  const accent = PRIORITY_COLOR[gap.priority];
  const dept = departmentByCategory(gap.category);
  const icon = dept ? CATEGORY_ICONS[dept.key] : CATEGORY_ICONS.tech_operations;
  const gapfixTint = gap.gapfix_path === "diy" ? "#E6F5EF" : "#FCEFE3";
  const statusColor = gap.status === "open" ? TEAL : gap.status === "in_progress" ? GOLD : MUTED;
  const rtl = isRtlText(gap.gap_title) || isRtlText(gap.impact) || isRtlText(gap.recommended_fix);

  return `
    <div class="gap-card" ${rtl ? 'dir="rtl"' : ""}>
      <div class="accent" style="background:${accent}"></div>
      <div class="gap-body">
        <div class="gap-head">
          <div class="icon-cell" style="background:${NAVY}">
            <svg width="24" height="24" viewBox="0 0 24 24" style="color:${TEAL_LIGHT}">${icon}</svg>
          </div>
          <div class="gap-title-block">
            <div class="gap-eyebrow">GAP ${index + 1} &middot; ${escapeHtml(gap.category.toUpperCase())}${
              gap.sub_category === "cross_channel"
                ? ` <span class="cross-channel-badge">CROSS-CHANNEL</span>`
                : ""
            }</div>
            <div class="gap-title">${escapeHtml(gap.gap_title)}</div>
          </div>
        </div>

        <div class="meta-row">
          <span>Priority <b style="color:${PRIORITY_COLOR[gap.priority]}">${gap.priority}</b></span>
          <span class="sep">|</span>
          <span>Effort <b>${gap.effort}</b></span>
          <span class="sep">|</span>
          <span>Status <b style="color:${statusColor}">${STATUS_LABEL[gap.status]}</b></span>
        </div>

        <div class="label">IMPACT</div>
        <p class="body-text">${escapeHtml(gap.impact)}</p>

        <div class="label">RECOMMENDED FIX</div>
        <p class="body-text">${escapeHtml(gap.recommended_fix)}</p>

        <span class="pill" style="background:${gapfixTint}">&rarr; ${escapeHtml(GAPFIX_LABEL[gap.gapfix_path])}</span>
      </div>
    </div>`;
}

export function renderRoadmapHtml(data: RoadmapPdfData): string {
  const presentDepartments = DEPARTMENTS.filter((d) => data.based_on_departments.includes(d.key));
  const overviewCols = (presentDepartments.length > 0 ? presentDepartments : DEPARTMENTS)
    .map((d) => overviewColumn(d, data.gaps))
    .join("");
  const gapCards = data.gaps.map((g, i) => gapCard(g, i)).join("");

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<!-- Base document stays LTR — this template's layout (icon-left labels,
     left-aligned meta rows, etc.) is LTR-designed. Arabic content (company
     name, individual gap text) gets its own per-element dir="rtl" instead of
     flipping the whole page, since a page-wide flip garbles LTR content that
     sits alongside it (e.g. an Arabic company name with English AI-generated
     gap text). -->

<head>
<meta charset="utf-8">
<title>GapLens Roadmap</title>
<style>
  @page { margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    color: ${TEXT_DARK};
    font-size: 13px;
    line-height: 1.5;
  }

  .cover {
    background: ${NAVY};
    color: #fff;
    min-height: 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 40px;
    text-align: center;
    page-break-after: always;
  }
  .wordmark { font-size: 46px; font-weight: 800; letter-spacing: 2px; margin: 0; }
  .cover-subtitle { color: ${TEAL}; font-style: italic; font-size: 17px; margin-top: 10px; }
  .company-logo { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; margin-top: 36px; border: 2px solid ${TEAL}; }
  .cover-company { font-weight: 700; font-size: 22px; margin-top: 10px; }
  .cover-company.no-logo { margin-top: 36px; }
  .cover-meta { color: ${MUTED}; font-size: 12px; margin-top: 8px; letter-spacing: 0.3px; }
  .confidence-label { text-transform: uppercase; letter-spacing: 2px; color: ${MUTED}; font-size: 11px; margin-top: 52px; font-weight: 700; }
  .ring-wrap { position: relative; width: 160px; height: 160px; margin-top: 18px; }
  .ring-percent { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .ring-percent .num { font-size: 38px; font-weight: 800; color: #fff; line-height: 1; }
  .ring-percent .pct { font-size: 10px; color: ${MUTED}; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }

  .overview {
    background: #fff;
    padding: 36px 32px 8px;
  }
  .overview-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .overview-col {
    flex: 1;
    min-width: 90px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
  }
  .badge {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .badge-label { font-weight: 700; color: ${NAVY}; font-size: 11.5px; line-height: 1.3; max-width: 110px; }
  .dots { display: flex; gap: 5px; }
  .dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }

  .gaps-section { padding: 8px 32px 32px; }
  .section-label {
    color: ${TEAL};
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 13px;
    font-weight: 800;
    padding-bottom: 10px;
    border-bottom: 2px solid ${TEAL};
    margin: 20px 0 20px;
  }

  .gap-card {
    display: flex;
    border: 1px solid ${BORDER};
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 16px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .accent { width: 8px; flex-shrink: 0; }
  .gap-body { padding: 16px 18px; flex: 1; }
  .gap-head { display: flex; align-items: flex-start; gap: 12px; }
  .icon-cell {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .gap-eyebrow { color: ${MUTED}; font-size: 10.5px; letter-spacing: 0.5px; font-weight: 700; }
  .cross-channel-badge { display: inline-block; background: ${GOLD}; color: ${NAVY}; border-radius: 100px; padding: 1px 8px; font-size: 9px; font-weight: 800; letter-spacing: 0.3px; }
  .gap-title { color: ${NAVY}; font-weight: 800; font-size: 16px; margin-top: 3px; }

  .meta-row {
    background: ${BG_LIGHT};
    border-radius: 6px;
    padding: 8px 12px;
    margin: 12px 0;
    font-size: 11.5px;
    color: #555;
    display: flex;
    gap: 8px;
  }
  .meta-row .sep { color: #cbd0d8; }
  .meta-row b { text-transform: capitalize; }

  .label { color: ${TEAL}; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10.5px; font-weight: 800; margin-top: 10px; }
  .body-text { color: #4a4f5a; font-size: 12px; margin: 4px 0 0; }

  .pill {
    display: inline-block;
    margin-top: 14px;
    padding: 6px 14px;
    border-radius: 100px;
    font-size: 11.5px;
    font-weight: 700;
    color: ${NAVY};
  }

  .footer {
    text-align: center;
    color: ${MUTED};
    font-style: italic;
    font-size: 11px;
    padding: 12px 40px 30px;
  }
</style>
</head>
<body>
  <section class="cover">
    <h1 class="wordmark">GAPLENS</h1>
    <div class="cover-subtitle">Digital Transformation Roadmap</div>
    ${data.company_logo_data_uri ? `<img class="company-logo" src="${data.company_logo_data_uri}" alt="" />` : ""}
    <div class="cover-company${data.company_logo_data_uri ? "" : " no-logo"}" dir="${isRtlText(data.company_name) ? "rtl" : "ltr"}">${escapeHtml(data.company_name)}</div>
    <div class="cover-meta">Version ${data.roadmap_version} &middot; Generated ${formatDate(data.generated_at)}</div>
    <div class="confidence-label">Roadmap Confidence</div>
    ${ringGaugeSvg(data.confidence_percent)}
  </section>

  <section class="overview">
    <div class="overview-row">${overviewCols}</div>
  </section>

  <section class="gaps-section">
    <div class="section-label">Your Gaps</div>
    ${gapCards || `<p class="body-text">No gaps identified yet.</p>`}
  </section>

  <p class="footer">GapLens turns fragmented tools and unclear processes into one clear, prioritized roadmap — generated from your Chat with AI deep-dive answers.</p>
</body>
</html>`;
}
