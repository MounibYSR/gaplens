-- Incremental migration: deep-dive responses + flexible invite links.
-- Run this once in the Supabase SQL Editor (does not touch existing data).

alter table team_invites add column department text
  check (
    department in (
      'digital_marketing',
      'tech_operations',
      'customer_experience',
      'data_decision_making',
      'team_readiness'
    )
  );
update team_invites set department = 'digital_marketing' where department is null;
alter table team_invites alter column department set not null;

alter table team_invites add column token uuid not null default gen_random_uuid();
alter table team_invites add column invitee_name text;
alter table team_invites alter column email drop not null;
alter table team_invites add constraint team_invites_token_unique unique (token);

create table deep_dive_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references assessment_sessions (id) on delete cascade,
  invite_id uuid references team_invites (id) on delete set null,
  department text not null check (
    department in (
      'digital_marketing',
      'tech_operations',
      'customer_experience',
      'data_decision_making',
      'team_readiness'
    )
  ),
  question_key text not null,
  answer_text text not null,
  started_at timestamptz not null default now(),
  answered_at timestamptz not null default now(),
  response_length int generated always as (char_length(answer_text)) stored,
  created_at timestamptz not null default now()
);

create index deep_dive_responses_session_dept_idx
  on deep_dive_responses (session_id, department);

alter table deep_dive_responses enable row level security;

create policy "select deep dive responses in own company" on deep_dive_responses
  for select using (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "insert deep dive responses in own company" on deep_dive_responses
  for insert with check (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );
