-- Roadmap versioning + gap status tracking + structured deep-dive source tagging.
-- Run this once in the Supabase SQL Editor (does not touch existing data).

alter table deep_dive_responses
  add column if not exists source text not null default 'freeform'
    check (source in ('seed', 'freeform'));

create table roadmap_versions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references assessment_sessions (id) on delete cascade,
  version int not null,
  generated_at timestamptz not null default now(),
  based_on_departments text[] not null default '{}',
  roadmap_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (session_id, version)
);

create index roadmap_versions_session_idx on roadmap_versions (session_id, version desc);

alter table roadmap_versions enable row level security;

create policy "select roadmap versions in own company" on roadmap_versions
  for select using (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "insert roadmap versions in own company" on roadmap_versions
  for insert with check (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create table gap_status_overrides (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references assessment_sessions (id) on delete cascade,
  gap_title text not null,
  status text not null check (status in ('open', 'in_progress', 'resolved')),
  updated_at timestamptz not null default now(),
  unique (session_id, gap_title)
);

alter table gap_status_overrides enable row level security;

create policy "select gap overrides in own company" on gap_status_overrides
  for select using (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "upsert gap overrides in own company" on gap_status_overrides
  for insert with check (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "update gap overrides in own company" on gap_status_overrides
  for update using (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );
