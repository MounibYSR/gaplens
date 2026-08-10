-- Adds storage for the shortened, universal 4-question scan that now powers
-- the main assessment (replacing the old 5-department question set).
alter table assessment_sessions
  add column if not exists overall_gap integer,
  add column if not exists scan_answers jsonb;
