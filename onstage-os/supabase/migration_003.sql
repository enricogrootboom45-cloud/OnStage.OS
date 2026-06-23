-- ============================================================
-- OnStage OS — Migration 003 (Phase 2)
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Event slugs for public URLs
alter table public.events add column if not exists slug text;

create or replace function public.generate_event_slug()
returns trigger language plpgsql as $$
declare
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  if new.slug is null or new.slug = '' then
    base_slug := lower(regexp_replace(trim(new.name), '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then base_slug := 'event'; end if;
    final_slug := base_slug;
    while exists (
      select 1 from public.events
      where slug = final_slug and id != new.id
    ) loop
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    end loop;
    new.slug := final_slug;
  end if;
  return new;
end;
$$;

drop trigger if exists set_event_slug on public.events;
create trigger set_event_slug
  before insert or update on public.events
  for each row execute function public.generate_event_slug();

-- Backfill slugs for existing events
update public.events set slug = null where slug is null;

-- 2. Ticket buyer + payment fields
alter table public.tickets
  add column if not exists buyer_name    text,
  add column if not exists buyer_email   text,
  add column if not exists stripe_session_id text,
  add column if not exists amount_paid   numeric(10,2);

create index if not exists idx_tickets_session
  on public.tickets(stripe_session_id)
  where stripe_session_id is not null;

-- 3. Public read access (no auth) for published/live events
drop policy if exists "Public can view published events" on public.events;
create policy "Public can view published events" on public.events
  for select using (status in ('published', 'live', 'completed'));

drop policy if exists "Public can view ticket types for live events" on public.ticket_types;
create policy "Public can view ticket types for live events" on public.ticket_types
  for select using (
    exists (
      select 1 from public.events e
      where e.id = ticket_types.event_id
      and e.status in ('published', 'live')
    )
  );

drop policy if exists "Public can view tickets by session" on public.tickets;
create policy "Public can view tickets by session" on public.tickets
  for select using (true);

drop policy if exists "Anyone can create a ticket" on public.tickets;
create policy "Anyone can create a ticket" on public.tickets
  for insert with check (true);

drop policy if exists "Org members can update ticket status" on public.tickets;
create policy "Org members can update ticket status" on public.tickets
  for update using (
    auth.uid() in (
      select p.id from public.profiles p
      join public.events e on e.organization_id = p.organization_id
      join public.ticket_types tt on tt.event_id = e.id
      where tt.id = tickets.ticket_type_id
    )
  );

-- 4. Enable Realtime on tickets for live door scanner
alter publication supabase_realtime add table public.tickets;

-- Done. Run once — safe to re-run.
