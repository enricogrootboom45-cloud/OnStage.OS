-- ============================================================
-- OnStage OS — Migration 003b (Phase 2 addendum)
-- Run AFTER migration_003.sql
-- ============================================================

-- 1. Atomic ticket counter — called by the fulfill-order edge function
create or replace function public.increment_ticket_sold(type_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ticket_types
  set quantity_sold = quantity_sold + 1
  where id = type_id;
end;
$$;

-- Only the service-role key (used by edge functions) can call this
grant execute on function public.increment_ticket_sold(uuid) to service_role;

-- 2. Prevent double-fulfillment if the success page is loaded twice
alter table public.tickets
  drop constraint if exists tickets_stripe_session_unique;
alter table public.tickets
  add constraint tickets_stripe_session_unique
  unique (stripe_session_id);

-- 3. Allow staff to link their auth account to a staff record
--    (used by the Self Clock-In page to find shifts)
drop policy if exists "Staff can update their own profile_id on staff records" on public.staff;
create policy "Staff can update their own profile_id on staff records" on public.staff
  for update
  using  (profile_id = auth.uid() or profile_id is null)
  with check (profile_id = auth.uid());

-- Done.
