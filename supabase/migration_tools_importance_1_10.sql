-- The Tool Map UI's importance slider has always used a 1-10 scale, but the
-- original schema constraint only ever allowed 1-5 — any tool saved with
-- importance above 5 has been silently failing. Widen the constraint to
-- match what the UI actually sends.
-- Run this once in the Supabase SQL Editor.

alter table tools drop constraint if exists tools_importance_check;
alter table tools add constraint tools_importance_check
  check (importance between 1 and 10);
