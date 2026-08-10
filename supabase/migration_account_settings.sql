-- Account settings (company name is already editable via the existing
-- "update own company" policy; this adds a logo) + ongoing freeform
-- "Chat with AI" discussion mode, persisted per company and separate from
-- the structured deep-dive.
-- Run this once in the Supabase SQL Editor (does not touch existing data).

alter table companies add column if not exists logo_url text;
alter table companies add column if not exists freeform_chat_summary text;
alter table companies add column if not exists freeform_chat_summarized_count int not null default 0;

-- ---------------------------------------------------------------------------
-- Storage bucket for uploaded company logos. Public read (so the sidebar and
-- the roadmap PDF can load the image directly by URL), write restricted to
-- the owning company's own folder (path convention: "{company_id}/logo.ext").
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do nothing;

create policy "public read company logos" on storage.objects
  for select using (bucket_id = 'company-logos');

create policy "company members upload own logo" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = auth_company_id()::text
  );

create policy "company members update own logo" on storage.objects
  for update to authenticated using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = auth_company_id()::text
  );

-- ---------------------------------------------------------------------------
-- Freeform "Chat with AI" — open-ended business development discussion,
-- distinct from the structured per-department deep-dive. Scoped to the
-- company (not a single assessment session) so it persists across sessions.
-- ---------------------------------------------------------------------------

create table freeform_chat_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index freeform_chat_messages_company_idx
  on freeform_chat_messages (company_id, created_at);

alter table freeform_chat_messages enable row level security;

create policy "select freeform chat in own company" on freeform_chat_messages
  for select using (company_id = auth_company_id());

create policy "insert freeform chat in own company" on freeform_chat_messages
  for insert with check (company_id = auth_company_id());
