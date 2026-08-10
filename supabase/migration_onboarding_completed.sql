-- Tracks whether a company has ever finished the first-time onboarding
-- flow (teaser quiz -> onboarding form -> full scan -> results), so login
-- routing can send returning accounts straight to the dashboard instead of
-- back through onboarding every time.
-- Run this once in the Supabase SQL Editor.

alter table companies add column if not exists onboarding_completed_at timestamptz;
