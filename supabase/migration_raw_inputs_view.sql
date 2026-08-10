-- Unified read-only view across every user-generated / AI-generated data
-- source in GapLens, so "all inputs for company X" is one query instead of
-- five. Deliberately a VIEW (not a duplicated table) — no dual-write to keep
-- in sync, always reflects the live per-feature tables, and RLS from those
-- tables still applies per-caller via security_invoker.
-- Run this once in the Supabase SQL Editor.

create or replace view raw_inputs
with (security_invoker = true)
as
  -- Teaser / quick-scan answers (one row per session that's completed the scan).
  select
    s.id as id,
    s.company_id as company_id,
    'teaser_quiz'::text as source_type,
    null::text as source_detail,
    s.scan_answers::text as content,
    coalesce(s.completed_at, s.started_at) as created_at
  from assessment_sessions s
  where s.scan_answers is not null

  union all

  -- Digital Tool Map entries.
  select
    t.id,
    s.company_id,
    'tool_map',
    coalesce(t.catalog_id, 'other'),
    format(
      'tool=%s importance=%s/10 connected=%s',
      t.name,
      t.importance,
      t.is_connected
    ),
    t.created_at
  from tools t
  join assessment_sessions s on s.id = t.session_id

  union all

  -- Structured deep-dive Q&A per department.
  select
    d.id,
    s.company_id,
    'deep_dive',
    d.department::text,
    format('[%s] %s', d.question_key, d.answer_text),
    d.answered_at
  from deep_dive_responses d
  join assessment_sessions s on s.id = d.session_id

  union all

  -- Ongoing open-discussion "Chat with AI" messages (both user and AI turns).
  select
    f.id,
    f.company_id,
    'freeform_chat',
    f.role,
    f.content,
    f.created_at
  from freeform_chat_messages f

  union all

  -- Visual Identity module: per-channel and cross-channel findings.
  select
    v.id,
    s.company_id,
    'visual_identity',
    v.type,
    v.result_gaps::text,
    v.created_at
  from visual_consultations v
  join assessment_sessions s on s.id = v.session_id;

comment on view raw_inputs is
  'Unified, read-only cross-source feed: teaser_quiz, tool_map, deep_dive, freeform_chat, visual_identity — one row per underlying record. Query with: select * from raw_inputs order by created_at desc;';
