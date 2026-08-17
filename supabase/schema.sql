-- GapLens — Supabase schema
-- Run this in the Supabase SQL editor (Database > SQL Editor) on a fresh project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text,
  size text,
  created_at timestamptz not null default now()
);

-- Profile row for every authenticated user, one-to-one with auth.users.
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid references companies (id) on delete set null,
  name text,
  role text not null default 'owner' check (role in ('owner', 'member')),
  email text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  team_size text check (team_size in ('1-5', '6-15', '16-50', '50+')),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table department_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references assessment_sessions (id) on delete cascade,
  department text not null check (
    department in (
      'digital_marketing',
      'tech_operations',
      'customer_experience',
      'data_decision_making',
      'team_readiness'
    )
  ),
  score int not null default 0 check (score between 0 and 100),
  answers jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (session_id, department)
);

create table tools (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references assessment_sessions (id) on delete cascade,
  name text not null,
  is_connected boolean not null default false,
  importance int not null default 3 check (importance between 1 and 10),
  position_x double precision,
  position_y double precision,
  created_at timestamptz not null default now()
);

create table roadmap_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references assessment_sessions (id) on delete cascade,
  gap_title text not null,
  priority int not null default 0,
  resolution_path text check (resolution_path in ('diy', 'refer', 'auto')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  created_at timestamptz not null default now()
);

-- A link to invite someone to answer one functional area in depth. `email` and
-- `invitee_name` are both optional: a solo/no-team company can generate a
-- generic "answer this area" link with nobody named, and share it however
-- they like (WhatsApp, email, etc.) — naming a recipient is a convenience,
-- never a requirement.
create table team_invites (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references assessment_sessions (id) on delete cascade,
  department text not null check (
    department in (
      'digital_marketing',
      'tech_operations',
      'customer_experience',
      'data_decision_making',
      'team_readiness'
    )
  ),
  token uuid not null default gen_random_uuid(),
  invitee_name text,
  email text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  invited_at timestamptz not null default now(),
  unique (token)
);

-- One free-text answer from the account holder's own deep-dive chat, or from
-- someone who followed an invite link. `invite_id` is null for the account
-- holder answering solo — a null here is not a gap, it's the normal case for
-- a one-person company reaching a complete, confident roadmap alone.
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

-- ---------------------------------------------------------------------------
-- Helper: current user's company_id, used by RLS policies below
-- ---------------------------------------------------------------------------

create or replace function auth_company_id()
returns uuid
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select company_id from users where id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security — every row is scoped to the caller's company
-- ---------------------------------------------------------------------------

alter table companies enable row level security;
alter table users enable row level security;
alter table assessment_sessions enable row level security;
alter table department_scores enable row level security;
alter table tools enable row level security;
alter table roadmap_items enable row level security;
alter table team_invites enable row level security;

create policy "select own company" on companies
  for select using (id = auth_company_id());

create policy "update own company" on companies
  for update using (id = auth_company_id());

-- A brand-new signup has no company yet, so it can't satisfy auth_company_id().
-- Any authenticated user may create the one company they'll then attach
-- themselves to as owner (see ensureProfile in src/lib/supabase/ensure-profile.ts).
create policy "authenticated users can create a company" on companies
  for insert to authenticated with check (true);

create policy "select own profile and teammates" on users
  for select using (company_id = auth_company_id() or id = auth.uid());

create policy "insert own profile" on users
  for insert to authenticated with check (id = auth.uid());

create policy "update own profile" on users
  for update using (id = auth.uid());

create policy "select sessions in own company" on assessment_sessions
  for select using (company_id = auth_company_id());

create policy "insert sessions in own company" on assessment_sessions
  for insert with check (company_id = auth_company_id());

create policy "update sessions in own company" on assessment_sessions
  for update using (company_id = auth_company_id());

create policy "select scores in own company" on department_scores
  for select using (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "insert scores in own company" on department_scores
  for insert with check (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "update scores in own company" on department_scores
  for update using (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "select tools in own company" on tools
  for select using (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "insert tools in own company" on tools
  for insert with check (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "update tools in own company" on tools
  for update using (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "delete tools in own company" on tools
  for delete using (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "select roadmap in own company" on roadmap_items
  for select using (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "insert roadmap in own company" on roadmap_items
  for insert with check (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "update roadmap in own company" on roadmap_items
  for update using (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "select invites in own company" on team_invites
  for select using (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "insert invites in own company" on team_invites
  for insert with check (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "update invites in own company" on team_invites
  for update using (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

-- deep_dive_responses: normal company-scoped access for the account holder.
-- Anonymous invite-link respondents never get a Supabase session, so their
-- writes go through the service-role admin client server-side instead (the
-- token is validated against team_invites before any insert) — see
-- src/lib/deep-dive/submit-response.ts.
alter table deep_dive_responses enable row level security;

create policy "select deep dive responses in own company" on deep_dive_responses
  for select using (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );

create policy "insert deep dive responses in own company" on deep_dive_responses
  for insert with check (
    session_id in (select id from assessment_sessions where company_id = auth_company_id())
  );
