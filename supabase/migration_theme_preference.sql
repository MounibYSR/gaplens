-- Lets each user's light/dark theme preference follow them across devices —
-- read server-side (see src/app/dashboard/page.tsx) to set data-theme before
-- first paint on the dashboard, the same way gl_lang cookie handling already
-- works for the EN/AR language switch, just per-user instead of per-browser.
-- No RLS change needed: the existing "update own profile" policy on users
-- (id = auth.uid()) already covers writes to this new column.
-- Run this once in the Supabase SQL Editor.

alter table users add column if not exists theme_preference text check (theme_preference in ('light', 'dark'));
