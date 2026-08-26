-- Cost of Inaction: optional per-tool monthly cost + a company-wide default
-- currency and average hourly labor cost estimate. Run this once in the
-- Supabase SQL Editor.

alter table tools
  add column if not exists monthly_cost numeric,
  add column if not exists currency text;

alter table companies
  add column if not exists currency text not null default 'USD',
  add column if not exists avg_hourly_cost numeric;
