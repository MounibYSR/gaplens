-- Hardens auth_company_id() against search_path hijacking: as a SECURITY
-- DEFINER function it previously resolved the unqualified `users` table
-- using the caller's session search_path rather than a fixed one. Pinning
-- it removes that class of risk, matching standard Postgres/Supabase
-- guidance for SECURITY DEFINER functions.
-- Run this once in the Supabase SQL Editor (does not touch existing data).

alter function auth_company_id() set search_path = public, pg_temp;
