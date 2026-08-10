-- Supports redoing a single department's deep-dive without erasing the old
-- answers: each redo becomes a new "attempt" for that department, so history
-- is preserved and progress between attempts can be compared.
-- Run this once in the Supabase SQL Editor.

alter table deep_dive_responses add column if not exists attempt int not null default 1;

create index if not exists deep_dive_responses_session_dept_attempt_idx
  on deep_dive_responses (session_id, department, attempt desc);
