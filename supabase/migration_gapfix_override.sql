-- The Roadmap Kanban board lets a user override which resolution path a gap
-- uses ("Do it myself" / "Get matched with a provider" / "Let GapLens
-- handle it"), the same way gap_status_overrides already lets them override
-- a gap's status. Adds one nullable column to that same table rather than a
-- new one — a gap's status and gapfix-path overrides live on the same
-- (session_id, gap_title) row, upserted independently.
-- Run this once in the Supabase SQL Editor.

alter table gap_status_overrides
  add column gapfix_path text check (gapfix_path in ('diy', 'vetted_provider', 'gaplens_executes'));
