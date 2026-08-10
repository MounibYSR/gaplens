-- "Fake door" test for a future "connect your tools" service — collects
-- interest signals only, no real integration is built or triggered.
-- Run this once in the Supabase SQL Editor.

create table feature_interest_signals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  event_type text not null check (event_type in ('click', 'submit')),
  price_band text check (price_band in ('none', 'low', 'mid', 'high')),
  platforms text[],
  created_at timestamptz not null default now()
);

create index feature_interest_signals_company_idx
  on feature_interest_signals (company_id, created_at);

alter table feature_interest_signals enable row level security;

create policy "select feature interest in own company" on feature_interest_signals
  for select using (company_id = auth_company_id());

create policy "insert feature interest in own company" on feature_interest_signals
  for insert with check (company_id = auth_company_id());
