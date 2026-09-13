-- Backs two new contact channels:
-- "Get matched with a provider" (Roadmap gap card) now submits a real
-- request instead of showing a coming-soon placeholder, and a new
-- "Contact Support" entry in the account menu sends a general message.
-- Both are tracked in the internal /admin/requests view (service-role read,
-- gated by an email allowlist in the page itself — no admin role system).
-- Run this once in the Supabase SQL Editor.

create table provider_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  session_id uuid not null references assessment_sessions (id) on delete cascade,
  gap_title text not null,
  gap_category text not null,
  note text,
  contact_method text not null check (contact_method in ('whatsapp', 'email')),
  contact_value text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'resolved')),
  created_at timestamptz not null default now()
);

create index provider_requests_company_idx
  on provider_requests (company_id, created_at);

alter table provider_requests enable row level security;

create policy "select provider requests in own company" on provider_requests
  for select using (company_id = auth_company_id());

create policy "insert provider requests in own company" on provider_requests
  for insert with check (company_id = auth_company_id());

create table support_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  topic text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
  created_at timestamptz not null default now()
);

create index support_requests_company_idx
  on support_requests (company_id, created_at);

alter table support_requests enable row level security;

create policy "select support requests in own company" on support_requests
  for select using (company_id = auth_company_id());

create policy "insert support requests in own company" on support_requests
  for insert with check (company_id = auth_company_id());
