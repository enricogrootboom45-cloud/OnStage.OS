-- migration_007: staff hourly rate, so event P&L can auto-pull real labor cost
-- from clocked shift hours instead of requiring a manual "Staff" cost line.

alter table public.staff
  add column if not exists hourly_rate numeric(10,2);

comment on column public.staff.hourly_rate is
  'ZAR per hour. Nullable — if unset, that staff member''s worked hours are shown but excluded from the auto-calculated P&L cost, and flagged so the organiser knows to set it.';