-- Platform knowledge base support (catalog_id on tools, so real Tool Map
-- entries can be matched against the platform knowledge base) + visual
-- consultation storage (UI/UX and Instagram screenshot reviews).
-- Run this once in the Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- tools: the table already existed in the schema but was never written to
-- (Tool Map only persisted a rolled-up {count, isolatedRatio} summary).
-- catalog_id lets us match a saved tool back to a known platform in
-- src/lib/roadmap/platform-knowledge.ts; null for freeform/"other" entries.
-- ---------------------------------------------------------------------------

alter table tools add column if not exists catalog_id text;
-- Existing RLS policies on `tools` (select/insert/update/delete, scoped to the
-- caller's own company) already cover this new column — nothing else to change.

-- ---------------------------------------------------------------------------
-- visual_consultations: results of the new "Website UI/UX Review" and
-- "Instagram Review" modules. Screenshots themselves are analyzed in-memory
-- and not retained — only the structured findings are stored, in the same
-- gap shape as roadmap_versions.roadmap_json.gaps, so they can be merged
-- straight into a generated roadmap.
-- ---------------------------------------------------------------------------

create table visual_consultations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references assessment_sessions (id) on delete cascade,
  type text not null check (type in ('ui_ux', 'instagram')),
  result_gaps jsonb not null,
  created_at timestamptz not null default now()
);

create index visual_consultations_session_idx on visual_consultations (session_id, created_at desc);

alter table visual_consultations enable row level security;

create policy "select visual consultations in own company" on visual_consultations
  for select using (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "insert visual consultations in own company" on visual_consultations
  for insert with check (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );
