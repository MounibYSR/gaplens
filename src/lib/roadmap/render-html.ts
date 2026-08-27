import type { GapEffort, GapFixPath, GapPriority, GapStatus } from "@/lib/supabase/types";
import type { CostOfInaction, RoadmapGap, RoadmapPhase } from "./build-prompt";

export type RoadmapPdfData = {
  roadmap_version: number;
  generated_at: string;
  company_name: string;
  company_logo_data_uri?: string | null;
  gaps: RoadmapGap[];
  cost_of_inaction?: CostOfInaction | null;
  executive_summary?: string | null;
  what_we_observed?: string | null;
  phased_roadmap?: RoadmapPhase[] | null;
  approach_note?: string[] | null;
};

// Light, print-document palette — this template only. The app's own
// navy/teal glassmorphic look is intentionally not reused here: this is a
// standalone deliverable handed to a client, not a screen of the product.
const INK = "#0A1628";
const BODY = "#3A4454";
const MUTED = "#6B7688";
const BORDER = "#E1E5EB";
const BG_SOFT = "#F4F6F9";
const TEAL = "#0F6E56";
const BRAND_TEAL = "#1D9E75";
const GOLD = "#8B6508";
const RED = "#A32D2D";
const GOLD_TINT = "#FDF2DC";
const RED_TINT = "#FBEAEA";
const TEAL_TINT = "#E1F5EE";

const PRIORITY_COLOR: Record<GapPriority, string> = { high: RED, medium: GOLD, low: TEAL };

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

// Deterministic effort -> duration mapping, never model-authored — same
// principle the app already applies to dollar figures (see
// RoadmapGap.related_tool_names in build-prompt.ts): a number a client
// might act on has to come from real data, not the model's judgment.
const EFFORT_WEEKS: Record<GapEffort, number> = { low: 0.75, medium: 1.5, high: 3.5 };

function formatDuration(weeks: number): string {
  if (weeks <= 1) return weeks <= 0.75 ? "3-5 days" : "1 week";
  const rounded = Math.round(weeks);
  return `${rounded} week${rounded === 1 ? "" : "s"}`;
}

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

function statBlock(value: string, label: string, color: string, tint: string): string {
  return `
    <div class="stat-block" style="background:${tint}">
      <div class="stat-value" style="color:${color}">${escapeHtml(value)}</div>
      <div class="stat-label">${escapeHtml(label)}</div>
    </div>`;
}

function gapCard(gap: RoadmapGap, index: number): string {
  const rtl = isRtlText(gap.gap_title) || isRtlText(gap.impact) || isRtlText(gap.recommended_fix);
  const statusColor = gap.status === "open" ? BRAND_TEAL : gap.status === "in_progress" ? GOLD : MUTED;

  return `
    <div class="gap-card" ${rtl ? 'dir="rtl"' : ""}>
      <div class="gap-title">GAP ${index + 1} &mdash; ${escapeHtml(gap.gap_title)}${
        gap.sub_category === "cross_channel" ? ` <span class="cross-channel-badge">CROSS-CHANNEL</span>` : ""
      }</div>
      <div class="gap-meta">PRIORITY: <b style="color:${PRIORITY_COLOR[gap.priority]}">${gap.priority.toUpperCase()}</b> &nbsp;&middot;&nbsp; STATUS: <b style="color:${statusColor}">${STATUS_LABEL[gap.status].toUpperCase()}</b></div>

      <div class="sub-label">THE PROBLEM</div>
      <p class="body-text">${escapeHtml(gap.impact)}</p>

      <div class="sub-label">THE GAPFIX SOLUTION</div>
      <p class="body-text">${escapeHtml(gap.recommended_fix)}</p>
      <p class="gapfix-path">&rarr; ${escapeHtml(GAPFIX_LABEL[gap.gapfix_path])}</p>

      <div class="impl-time">IMPLEMENTATION TIME: ${formatDuration(EFFORT_WEEKS[gap.effort])}</div>
    </div>`;
}

function costOfInactionSection(coi: CostOfInaction | null | undefined): string {
  if (!coi || coi.line_items.length === 0) return "";
  const rows = coi.line_items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.area)}${item.note ? `<div class="coi-note">${escapeHtml(item.note)}</div>` : ""}</td>
        <td class="coi-amount" style="color:${RED}">${item.estimated_monthly_amount != null ? `~${item.estimated_monthly_amount} ${escapeHtml(item.currency)}` : "&mdash;"}</td>
      </tr>`,
    )
    .join("");
  const totalRow =
    coi.total_estimated_recoverable != null
      ? `
      <tr class="coi-total-row">
        <td>Estimated recoverable with fixes above</td>
        <td class="coi-amount" style="color:${TEAL}">~${coi.total_estimated_recoverable} ${escapeHtml(coi.currency)} / month</td>
      </tr>`
      : "";

  return `
  <section class="doc-section">
    <div class="section-label">Cost of Inaction</div>
    <p class="body-text" style="margin-bottom:16px;">Estimated, not exact — based on your own tool costs and manual-work answers.</p>
    <table class="coi-table">
      <thead><tr><th>Area</th><th class="coi-amount">Estimated Monthly Cost</th></tr></thead>
      <tbody>${rows}${totalRow}</tbody>
    </table>
  </section>`;
}

function phasedRoadmapSection(phases: RoadmapPhase[] | null | undefined): string {
  if (!phases || phases.length === 0) return "";
  const phaseBlocks = phases
    .map((phase, i) => {
      const items = phase.items.length
        ? `<ol class="phase-items">${phase.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`
        : "";
      const note = phase.note ? `<p class="body-text">${escapeHtml(phase.note)}</p>` : "";
      return `
        <div class="phase-block">
          <div class="phase-heading">Phase ${i + 1} &mdash; ${escapeHtml(phase.phase_label)}</div>
          ${items}
          ${note}
        </div>`;
    })
    .join("");

  return `
  <section class="doc-section">
    <div class="section-label">The GapFix Roadmap</div>
    <p class="body-text" style="margin-bottom:16px;">A sequenced, low-risk implementation plan.</p>
    ${phaseBlocks}
  </section>`;
}

function approachNoteSection(notes: string[] | null | undefined): string {
  if (!notes || notes.length === 0) return "";
  const items = notes.map((n) => `<li>${escapeHtml(n)}</li>`).join("");

  return `
  <section class="doc-section">
    <div class="section-label">A Note on Approach</div>
    <p class="body-text" style="margin-bottom:12px;">Here's why this roadmap is sequenced the way it is:</p>
    <ul class="approach-list">${items}</ul>
    <div class="tagline-block">
      <div class="tagline">GapLens finds the gap. GapFix closes it.</div>
      <div class="signature">Yousra Mounib &amp; Sonia Chebili &middot; GapLens &middot; Digital Incubation Center, Qatar</div>
    </div>
  </section>`;
}

export function renderRoadmapHtml(data: RoadmapPdfData): string {
  const openGaps = data.gaps.filter((g) => g.status !== "resolved");
  const gapsIdentifiedStat = statBlock(String(openGaps.length), "Gaps Identified", GOLD, GOLD_TINT);
  const savingsStat =
    data.cost_of_inaction?.total_estimated_recoverable != null
      ? statBlock(
          `~${data.cost_of_inaction.total_estimated_recoverable} ${data.cost_of_inaction.currency}`,
          "Est. Monthly Savings",
          RED,
          RED_TINT,
        )
      : "";
  const totalWeeks = openGaps.reduce((sum, g) => sum + EFFORT_WEEKS[g.effort], 0);
  const fixTimeStat = openGaps.length > 0 ? statBlock(formatDuration(totalWeeks), "Total Fix Time", TEAL, TEAL_TINT) : "";

  const gapCards = data.gaps.map((g, i) => gapCard(g, i)).join("");
  const companyRtl = isRtlText(data.company_name);

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<!-- Base document stays LTR — this template's layout (left-aligned labels,
     left-to-right meta rows, etc.) is LTR-designed. Arabic content (company
     name, individual gap text) gets its own per-element dir="rtl" instead of
     flipping the whole page, since a page-wide flip garbles LTR content that
     sits alongside it. -->

<head>
<meta charset="utf-8">
<title>GapLens Gap Score Report</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    color: ${BODY};
    font-size: 14px;
    line-height: 1.6;
    background: #fff;
  }

  .page-pad { padding: 0 48px; }

  .cover {
    padding: 64px 48px 32px;
    text-align: center;
  }
  .wordmark { font-size: 28px; font-weight: 800; letter-spacing: 1px; margin: 0; color: ${INK}; }
  .wordmark .accent { color: ${BRAND_TEAL}; }
  .cover-title { font-size: 22px; font-weight: 800; color: ${INK}; margin-top: 20px; letter-spacing: 0.3px; }
  .company-logo { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; margin-top: 28px; }
  .cover-subtitle { font-size: 14px; color: ${MUTED}; margin-top: 12px; }
  .cover-company { font-weight: 700; font-size: 16px; color: ${INK}; margin-top: 4px; }
  .cover-meta { color: ${MUTED}; font-size: 11px; margin-top: 8px; letter-spacing: 0.3px; }

  .stats-row {
    display: flex;
    gap: 16px;
    margin-top: 40px;
  }
  .stat-block {
    flex: 1;
    border-radius: 6px;
    padding: 20px 12px;
    text-align: center;
  }
  .stat-value { font-size: 26px; font-weight: 800; }
  .stat-label { font-size: 11px; color: ${MUTED}; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; font-weight: 700; }

  .doc-section { padding: 28px 0; border-top: 1px solid ${BORDER}; }
  .doc-section:first-of-type { border-top: none; }
  .section-label {
    color: ${INK};
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-size: 13px;
    font-weight: 800;
    padding-bottom: 10px;
    border-bottom: 2px solid ${BRAND_TEAL};
    margin-bottom: 16px;
    display: inline-block;
  }

  .body-text { color: ${BODY}; font-size: 13px; margin: 0 0 10px; }

  .observed-box {
    background: ${BG_SOFT};
    border-radius: 6px;
    padding: 16px 20px;
  }
  .observed-box .body-text { margin-bottom: 0; }

  .gap-card {
    background: ${BG_SOFT};
    border-radius: 6px;
    padding: 18px 20px;
    margin-bottom: 14px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .gap-title { color: ${INK}; font-weight: 800; font-size: 15px; }
  .cross-channel-badge { display: inline-block; background: ${GOLD_TINT}; color: ${GOLD}; border-radius: 100px; padding: 3px 8px; font-size: 10px; font-weight: 800; letter-spacing: 0.3px; }
  .gap-meta { color: ${MUTED}; font-size: 11px; font-weight: 700; margin-top: 6px; letter-spacing: 0.3px; }

  .sub-label { color: ${INK}; text-transform: uppercase; letter-spacing: 0.5px; font-size: 11px; font-weight: 800; margin-top: 12px; }
  .gapfix-path { color: ${TEAL}; font-size: 12px; font-weight: 700; margin: 0; }
  .impl-time { color: ${MUTED}; font-size: 11px; font-weight: 700; margin-top: 10px; letter-spacing: 0.3px; }

  .phase-block { margin-bottom: 18px; }
  .phase-heading { color: ${INK}; font-weight: 800; font-size: 14px; margin-bottom: 6px; }
  .phase-items { margin: 0; padding-left: 20px; color: ${BODY}; font-size: 13px; }
  .phase-items li { margin-bottom: 4px; }

  .approach-list { margin: 0 0 20px; padding-left: 20px; color: ${BODY}; font-size: 13px; }
  .approach-list li { margin-bottom: 6px; }

  .tagline-block { text-align: center; border-top: 1px solid ${GOLD}; padding-top: 16px; margin-top: 8px; }
  .tagline { color: ${GOLD}; font-weight: 800; font-size: 14px; }
  .signature { color: ${MUTED}; font-size: 11px; margin-top: 4px; }

  .coi-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .coi-table th {
    text-align: left;
    color: #fff;
    background: ${INK};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 11px;
    font-weight: 800;
    padding: 10px 12px;
  }
  .coi-table td { padding: 12px; border-bottom: 1px solid ${BORDER}; color: ${INK}; }
  .coi-amount { text-align: right; font-weight: 700; white-space: nowrap; }
  .coi-note { color: ${MUTED}; font-size: 11px; margin-top: 4px; font-weight: 400; }
  .coi-total-row td { font-weight: 800; border-bottom: none; border-top: 2px solid ${TEAL}; }

  .footer-note {
    text-align: center;
    color: ${MUTED};
    font-size: 11px;
    padding: 20px 48px 40px;
  }
</style>
</head>
<body>
  <section class="cover page-pad">
    <h1 class="wordmark">GapLens<span class="accent"> AI</span></h1>
    <div class="cover-title">GAP SCORE REPORT &amp; DIGITAL TRANSFORMATION ROADMAP</div>
    ${data.company_logo_data_uri ? `<img class="company-logo" src="${data.company_logo_data_uri}" alt="" />` : ""}
    <div class="cover-subtitle">Prepared exclusively for</div>
    <div class="cover-company" dir="${companyRtl ? "rtl" : "ltr"}">${escapeHtml(data.company_name)}</div>
    <div class="cover-meta">Version ${data.roadmap_version} &middot; Generated ${formatDate(data.generated_at)}</div>

    <div class="stats-row">
      ${gapsIdentifiedStat}
      ${savingsStat}
      ${fixTimeStat}
    </div>
  </section>

  <div class="page-pad">
    ${
      data.executive_summary
        ? `<section class="doc-section">
            <div class="section-label">Executive Summary</div>
            ${data.executive_summary
              .split(/\n+/)
              .filter(Boolean)
              .map((p) => `<p class="body-text">${escapeHtml(p)}</p>`)
              .join("")}
          </section>`
        : ""
    }

    ${
      data.what_we_observed
        ? `<section class="doc-section">
            <div class="section-label">What We Observed</div>
            <div class="observed-box">
              <p class="body-text">${escapeHtml(data.what_we_observed)}</p>
            </div>
          </section>`
        : ""
    }

    <section class="doc-section">
      <div class="section-label">The Gap Score</div>
      ${gapCards || `<p class="body-text">No gaps identified yet.</p>`}
    </section>

    ${costOfInactionSection(data.cost_of_inaction)}
    ${phasedRoadmapSection(data.phased_roadmap)}
    ${approachNoteSection(data.approach_note)}
  </div>

  <p class="footer-note">GapLens turns fragmented tools and unclear processes into one clear, prioritized roadmap.</p>
</body>
</html>`;
}
