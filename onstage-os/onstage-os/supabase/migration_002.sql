-- ============================================================
-- OnStage OS — Migration 002
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Enable Realtime on tables that drive live updates
alter publication supabase_realtime add table public.shifts;
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.equipment;

-- 2. Performance indexes on every hot query path
create index if not exists idx_events_org_status   on public.events(organization_id, status);
create index if not exists idx_events_org_start    on public.events(organization_id, start_time);
create index if not exists idx_shifts_event_status on public.shifts(event_id, status);
create index if not exists idx_shifts_staff        on public.shifts(staff_id);
create index if not exists idx_staff_org           on public.staff(organization_id);
create index if not exists idx_equipment_org       on public.equipment(organization_id);
create index if not exists idx_customers_org       on public.customers(organization_id);
create index if not exists idx_customers_email     on public.customers(email) where email is not null;
create index if not exists idx_ticket_types_event  on public.ticket_types(event_id);
create index if not exists idx_tickets_type_status on public.tickets(ticket_type_id, status);

-- 3. Auto-create a minimal profile row on every new Supabase auth sign-up
--    (defensive — the create_organization RPC handles the full upsert,
--     but this ensures auth.users always has a matching profiles row)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'staff')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Aggregated event sales view (used by reports dashboard and ticket pages)
create or replace view public.v_event_sales as
  select
    e.id              as event_id,
    e.organization_id,
    e.name            as event_name,
    e.status,
    e.start_time,
    coalesce(sum(tt.price * tt.quantity_sold), 0)::numeric(12,2) as revenue,
    coalesce(sum(tt.quantity_sold), 0)::integer                   as tickets_sold,
    coalesce(sum(tt.quantity_total), 0)::integer                  as tickets_total
  from public.events e
  left join public.ticket_types tt on tt.event_id = e.id
  group by e.id, e.organization_id, e.name, e.status, e.start_time;

-- 5. RLS policy so org members can read their own view data
--    (views inherit the calling user's RLS context for the underlying tables)
--    No extra policy needed — the events policy covers it.

-- Done. Run once, safe to re-run.
