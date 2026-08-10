-- Merges the separate "Website UI/UX Review" and "Instagram Review" modules
-- into a single "Visual Identity" flow (per-channel findings + a cross-
-- channel consistency comparison). Replaces the old ui_ux/instagram type
-- values with a single visual_identity value.
-- Run this once in the Supabase SQL Editor.

-- Old ui_ux/instagram rows predate the merged schema and are incompatible
-- with it (different result_gaps shape) — safe to clear since they're
-- regenerable AI analysis output, not source data.
delete from visual_consultations where type not in ('visual_identity');

alter table visual_consultations drop constraint if exists visual_consultations_type_check;
alter table visual_consultations add constraint visual_consultations_type_check
  check (type in ('visual_identity'));
