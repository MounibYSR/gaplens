-- Backs two of the three GapFix path actions on a Roadmap Kanban card:
-- "Do it myself" caches its AI-generated step-by-step guide per gap so it
-- doesn't regenerate on every view, and "Get matched with a provider" logs
-- a Fake Door Test interest signal (no real provider network exists yet).
-- "Let GapLens handle it" stays a disabled placeholder — no schema needed.
-- Run this once in the Supabase SQL Editor.

alter table gap_status_overrides
  add column diy_guide jsonb,
  add column diy_guide_source text;

create table provider_match_interest (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  session_id uuid not null references assessment_sessions (id) on delete cascade,
  gap_title text not null,
  category text not null,
  created_at timestamptz not null default now()
);

create index provider_match_interest_company_idx
  on provider_match_interest (company_id, created_at);

alter table provider_match_interest enable row level security;

create policy "select provider match interest in own company" on provider_match_interest
  for select using (company_id = auth_company_id());

create policy "insert provider match interest in own company" on provider_match_interest
  for insert with check (company_id = auth_company_id());
