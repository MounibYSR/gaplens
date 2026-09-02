-- The Structured Assessment now opens with a one-time "Business Context"
-- question set, asked before any department. Its answers feed the same
-- roadmap/raw_inputs pipeline as department answers, stored in
-- deep_dive_responses under department = 'business_context' — not a real
-- Department, so it needs its own slot in this check constraint.
-- Run this once in the Supabase SQL Editor.

alter table deep_dive_responses drop constraint if exists deep_dive_responses_department_check;
alter table deep_dive_responses add constraint deep_dive_responses_department_check
  check (department in (
    'digital_marketing',
    'tech_operations',
    'customer_experience',
    'data_decision_making',
    'team_readiness',
    'business_context'
  ));
