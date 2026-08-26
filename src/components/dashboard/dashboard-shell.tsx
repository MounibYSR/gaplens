"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { logOut } from "@/lib/actions/auth";
import { ChatTab } from "@/components/dashboard/chat-tab";
import { OverviewSection } from "@/components/dashboard/overview-section";
import { RoadmapSection } from "@/components/dashboard/roadmap-section";
import { TeamSection } from "@/components/dashboard/team-section";
import { GapFixSection } from "@/components/dashboard/gapfix-section";
import { ToolMapSection } from "@/components/dashboard/tool-map-section";
import { AccountSettingsModal } from "@/components/dashboard/account-settings-modal";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { Department, ResolutionPath } from "@/lib/supabase/types";
import type { computeConfidence } from "@/lib/deep-dive/confidence";
import type { TeaserAnswers } from "@/lib/scan/scoring";
import type { RoadmapGap, CostOfInaction } from "@/lib/roadmap/build-prompt";
import type { FreeformChatMessage } from "@/lib/freeform-chat/types";
import type { CompanyTool } from "@/app/dashboard/tool-map-actions";

type ExistingInvite = {
  id: string;
  department: Department;
  token: string;
  invitee_name: string | null;
  status: string;
};

type Section = "overview" | "chat" | "team" | "roadmap" | "gapfix" | "toolmap";

function OverviewIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
      <rect x="3" y="10" width="3" height="7" rx="0.6" />
      <rect x="8.5" y="6" width="3" height="11" rx="0.6" />
      <rect x="14" y="2.5" width="3" height="14.5" rx="0.6" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
      <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5v7A1.5 1.5 0 0 1 15.5 13H8l-4 3.2V13H4.5A1.5 1.5 0 0 1 3 11.5v-7Z" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="6.5" r="2.3" />
      <path d="M2.5 16.5c0-3 2-5 4.5-5s4.5 2 4.5 5" />
      <circle cx="14.5" cy="7.5" r="1.8" />
      <path d="M12 12c2.3 0 4 1.7 4.3 4.5" />
    </svg>
  );
}

function RoadmapIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M3 5.5 7 4l4 1.5 4-1.5v10l-4 1.5-4-1.5-4 1.5v-10Z" />
      <path d="M7 4v10M11 5.5v10" strokeLinecap="round" />
    </svg>
  );
}

function GapFixIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="6.5" />
      <circle cx="10" cy="10" r="3.5" />
      <circle cx="10" cy="10" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ToolMapIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="2.6" />
      <circle cx="3.5" cy="4" r="1.6" />
      <circle cx="16.5" cy="4" r="1.6" />
      <circle cx="3.5" cy="16" r="1.6" />
      <circle cx="16.5" cy="16" r="1.6" />
      <path d="M8.2 8.6 4.8 5.1M11.8 8.6l3.4-3.5M8.2 11.4l-3.4 3.5M11.8 11.4l3.4 3.5" strokeLinecap="round" />
    </svg>
  );
}

function BurgerIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 5.5h14M3 10h14M3 14.5h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4.5 4.5l11 11M15.5 4.5l-11 11" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-muted">
      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AccountMenu({
  imageUrl,
  initial,
  name,
  subtitle,
  accountSettingsLabel,
  logOutLabel,
  onOpenSettings,
}: {
  imageUrl: string | null;
  initial: string;
  name: string;
  subtitle: string;
  accountSettingsLabel: string;
  logOutLabel: string;
  onOpenSettings: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loggingOut, startLogOut] = useTransition();

  return (
    <div className="relative mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-xl border p-3 text-start transition-opacity hover:opacity-80"
        style={{ borderColor: "var(--border-g)", background: "var(--glass-2)" }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
        ) : (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-navy"
            style={{ background: "var(--teal-2)" }}
          >
            {initial}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{name}</p>
          <p className="truncate text-xs text-muted">{subtitle}</p>
        </div>
        <ChevronDownIcon />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute start-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border shadow-2xl"
            style={{ borderColor: "var(--border-g)", background: "var(--modal-bg)" }}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenSettings();
              }}
              className="block w-full px-4 py-3 text-start text-sm font-bold text-ink hover:opacity-80"
            >
              {accountSettingsLabel}
            </button>
            <button
              type="button"
              onClick={() => startLogOut(() => logOut())}
              disabled={loggingOut}
              className="block w-full border-t px-4 py-3 text-start text-sm font-bold disabled:opacity-60"
              style={{ borderColor: "var(--border-g)", color: "var(--gap)" }}
            >
              {loggingOut ? "…" : logOutLabel}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

type DashboardShellProps = {
  lang: EntryLang;
  sessionId: string;
  companyId: string;
  companyName: string;
  logoUrl: string | null;
  currency: string;
  avgHourlyCost: number | null;
  userName: string | null;
  userEmail: string;
  avatarUrl: string | null;
  overview: {
    overallGap: number;
    answers: TeaserAnswers;
    completenessPct: number;
    trendDelta: number | null;
    roundProgressDelta: number | null;
  };
  confidence: ReturnType<typeof computeConfidence>;
  invites: ExistingInvite[];
  origin: string;
  gapFix: {
    gapTitle: string;
    gap: number;
    insight: string;
    alreadyChosen: ResolutionPath | null;
  };
  roadmapGaps: {
    version: number | null;
    gaps: RoadmapGap[];
    trendDelta: number | null;
    costOfInaction: CostOfInaction | null;
  };
  departmentCoverage: { key: Department; pct: number }[];
  freeformChatHistory: FreeformChatMessage[];
  companyTools: CompanyTool[];
};

function DashboardShellInner({
  lang,
  sessionId,
  companyId,
  companyName,
  logoUrl,
  currency,
  avgHourlyCost,
  userName,
  userEmail,
  avatarUrl,
  overview,
  confidence,
  invites,
  origin,
  gapFix,
  roadmapGaps,
  departmentCoverage,
  freeformChatHistory,
  companyTools,
}: DashboardShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const validSections: Section[] = ["overview", "chat", "team", "roadmap", "gapfix", "toolmap"];
  const initialSection: Section = validSections.includes(sectionParam as Section)
    ? (sectionParam as Section)
    : "overview";
  const [section, setSectionState] = useState<Section>(initialSection);

  // Keep the URL in sync with the active tab so refreshing or sharing the
  // link lands back on the same section instead of silently resetting to
  // Overview.
  function setSection(next: Section) {
    setSectionState(next);
    router.replace(`/dashboard?section=${next}`, { scroll: false });
  }
  const [answeredDepartments, setAnsweredDepartments] = useState<Department[]>(
    confidence.coveredDepartments,
  );
  const [accountName, setAccountName] = useState(companyName);
  const [accountLogoUrl, setAccountLogoUrl] = useState(logoUrl);
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const nav = appDictionary[lang].dashboardNav;

  const NAV_ITEMS: { key: Section; label: string; icon: () => React.JSX.Element }[] = [
    { key: "overview", label: nav.overview, icon: OverviewIcon },
    { key: "chat", label: nav.chat, icon: ChatIcon },
    { key: "team", label: nav.team, icon: TeamIcon },
    { key: "roadmap", label: nav.roadmap, icon: RoadmapIcon },
    { key: "toolmap", label: nav.toolmap, icon: ToolMapIcon },
    { key: "gapfix", label: nav.gapfix, icon: GapFixIcon },
  ];

  const displayName = userName ?? userEmail;
  const initial = (accountName || "G").trim().charAt(0).toUpperCase();
  const sidebarImageUrl = accountLogoUrl ?? avatarUrl;

  return (
    <div className="flex flex-1">
      {/* Sidebar — md+ only */}
      <aside
        className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-e px-4 py-6 md:flex"
        style={{ borderColor: "var(--border-g)", background: "var(--glass)" }}
      >
        <Link href="/" className="mb-6 flex items-center gap-2 px-1 text-base font-extrabold text-ink transition-opacity hover:opacity-80">
          <Image src="/gaplens-icon.png" alt="" width={24} height={24} className="h-6 w-6" />
          GapLens<span style={{ color: "var(--teal-2)" }}> AI</span>
        </Link>

        <AccountMenu
          imageUrl={sidebarImageUrl}
          initial={initial}
          name={accountName}
          subtitle={displayName}
          accountSettingsLabel={appDictionary[lang].accountSettings.title}
          logOutLabel={appDictionary[lang].accountSettings.logOut}
          onOpenSettings={() => setShowSettings(true)}
        />

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = section === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSection(item.key)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm font-bold transition-colors"
                style={{
                  background: active ? "var(--teal-2)" : "transparent",
                  color: active ? "var(--navy)" : "var(--ink)",
                }}
              >
                <Icon />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header
          className="flex items-center justify-between border-b px-6 py-4 md:hidden"
          style={{ borderColor: "var(--border-g)" }}
        >
          <Link href="/" className="flex shrink-0 items-center gap-2 text-sm font-extrabold text-ink">
            <Image src="/gaplens-icon.png" alt="" width={20} height={20} className="h-5 w-5" />
            GapLens<span style={{ color: "var(--teal-2)" }}> AI</span>
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <span className="min-w-0 truncate text-end text-xs text-muted">{accountName}</span>
            <button
              type="button"
              onClick={() => setShowMobileNav((v) => !v)}
              aria-label={showMobileNav ? "Close menu" : "Open menu"}
              className="flex shrink-0 items-center justify-center rounded-lg border p-2 text-ink"
              style={{ borderColor: "var(--border-g)" }}
            >
              {showMobileNav ? <CloseIcon /> : <BurgerIcon />}
            </button>
          </div>
        </header>

        {/* Mobile burger menu */}
        {showMobileNav && (
          <>
            <div
              className="fixed inset-0 z-40 md:hidden"
              onClick={() => setShowMobileNav(false)}
            />
            <nav
              className="relative z-50 flex flex-col gap-1 border-b px-4 py-3 md:hidden"
              style={{ borderColor: "var(--border-g)", background: "var(--modal-bg)" }}
            >
              <AccountMenu
                imageUrl={sidebarImageUrl}
                initial={initial}
                name={accountName}
                subtitle={displayName}
                accountSettingsLabel={appDictionary[lang].accountSettings.title}
                logOutLabel={appDictionary[lang].accountSettings.logOut}
                onOpenSettings={() => {
                  setShowSettings(true);
                  setShowMobileNav(false);
                }}
              />

              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = section === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setSection(item.key);
                      setShowMobileNav(false);
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm font-bold transition-colors"
                    style={{
                      background: active ? "var(--teal-2)" : "transparent",
                      color: active ? "var(--navy)" : "var(--ink)",
                    }}
                  >
                    <Icon />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </>
        )}

        <main className="flex flex-1 flex-col items-center px-6 py-10">
          {section === "overview" && (
            <OverviewSection
              lang={lang}
              overallGap={overview.overallGap}
              answers={overview.answers}
              completenessPct={overview.completenessPct}
              trendDelta={overview.trendDelta}
              roundProgressDelta={overview.roundProgressDelta}
              departmentCoverage={departmentCoverage}
              gaps={roadmapGaps.gaps}
              onSwitchToChat={() => setSection("chat")}
            />
          )}

          {section === "chat" && (
            <ChatTab
              sessionId={sessionId}
              lang={lang}
              answeredDepartments={answeredDepartments}
              onDepartmentAnswered={(dept) =>
                setAnsweredDepartments((prev) => (prev.includes(dept) ? prev : [...prev, dept]))
              }
              onComplete={() => setSection("roadmap")}
              gaps={roadmapGaps.gaps}
              initialFreeformMessages={freeformChatHistory}
              companyTools={companyTools}
            />
          )}

          {section === "team" && (
            <TeamSection sessionId={sessionId} existingInvites={invites} lang={lang} origin={origin} />
          )}

          {section === "roadmap" && (
            <RoadmapSection
              lang={lang}
              sessionId={sessionId}
              confidence={confidence}
              answeredDepartments={answeredDepartments}
              version={roadmapGaps.version}
              gaps={roadmapGaps.gaps}
              trendDelta={roadmapGaps.trendDelta}
              costOfInaction={roadmapGaps.costOfInaction}
              departmentCoverage={departmentCoverage}
              onSwitchToChat={() => setSection("chat")}
              onSwitchToTeam={() => setSection("team")}
            />
          )}

          {section === "toolmap" && (
            <ToolMapSection lang={lang} companyId={companyId} initialTools={companyTools} />
          )}

          {section === "gapfix" && (
            <GapFixSection
              sessionId={sessionId}
              companyId={companyId}
              gapTitle={gapFix.gapTitle}
              gap={gapFix.gap}
              insight={gapFix.insight}
              alreadyChosen={gapFix.alreadyChosen}
              lang={lang}
            />
          )}
        </main>
      </div>

      {showSettings && (
        <AccountSettingsModal
          lang={lang}
          companyId={companyId}
          initialName={accountName}
          initialLogoUrl={accountLogoUrl}
          initialCurrency={currency}
          initialAvgHourlyCost={avgHourlyCost}
          onClose={() => setShowSettings(false)}
          onSaved={(name, newLogoUrl) => {
            setAccountName(name);
            setAccountLogoUrl(newLogoUrl);
          }}
        />
      )}
    </div>
  );
}

export function DashboardShell(props: DashboardShellProps) {
  return (
    <Suspense fallback={null}>
      <DashboardShellInner {...props} />
    </Suspense>
  );
}
